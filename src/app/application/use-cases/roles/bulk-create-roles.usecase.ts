import { Injectable, inject } from '@angular/core';
import { ROLE_REPOSITORY, CLOCK_PORT } from '@di/tokens';
import type { RoleRepository } from '@domain/repositories/business/role.repository';
import type { ClockPort } from '@domain/repositories/system/clock.repository';
import { ApplicationError } from '../../errors/application-error';
import { ApplicationErrorTransformer } from '@application/errors/application-error.transformer';
import { Role } from '@domain/entities/role.entity';
import { CreateRoleContract } from '@domain/contracts/role.contract';

/**
 * Individual role creation data interface
 */
export interface RoleCreationData {
    readonly name: string;
    readonly accessLevel: number;
    readonly description: string;
    readonly canLeadProjects: boolean;
    readonly isUniquePerTeam: boolean;
}

/**
 * Request interface for bulk role creation
 */
export interface BulkCreateRolesRequest {
    readonly roles: readonly RoleCreationData[];
    readonly requestedBy: number;
    readonly validateOnly?: boolean;
    readonly continueOnError?: boolean;
    readonly maxBatchSize?: number;
    readonly transactionId?: string;
}

/**
 * Individual creation result
 */
export interface RoleCreationResult {
    readonly index: number;
    readonly name: string;
    readonly success: boolean;
    readonly role?: Role;
    readonly error?: string;
    readonly conflictFields?: string[];
    readonly retryable?: boolean;
}

/**
 * Response interface for bulk role creation
 */
export interface BulkCreateRolesResponse {
    readonly results: readonly RoleCreationResult[];
    readonly summary: {
        readonly total: number;
        readonly successful: number;
        readonly failed: number;
        readonly skipped: number;
    };
    readonly transactionId?: string;
    readonly performance: {
        readonly executionTime: number;
        readonly averageTime: number;
        readonly duplicateDetections: number;
    };
}

/**
 * Bulk Create Roles Use Case
 *
 * @description
 * Specialized application layer orchestrator for bulk role creation operations.
 * This use case handles batch processing with optimized validation, duplicate detection,
 * comprehensive error handling, and detailed reporting for large-scale role creation.
 *
 * @responsibilities
 * - Batch validation and processing optimization
 * - Duplicate detection across batch and existing data
 * - Individual error tracking and recovery
 * - Performance monitoring and reporting
 * - Transaction management for data consistency
 *
 * @architecture
 * - Specialized bulk operation orchestrator
 * - Optimized for large-scale processing
 * - Individual result tracking for each item
 * - Performance and audit metrics collection
 *
 * @version 1.0.0
 * @since 2024-01-01
 * @layer Application
 */
@Injectable({ providedIn: 'root' })
export class BulkCreateRoles {
    private readonly roleRepo = inject<RoleRepository>(ROLE_REPOSITORY);
    private readonly clock = inject<ClockPort>(CLOCK_PORT);
    private readonly errorTransformer = inject(ApplicationErrorTransformer);

    /**
     * Execute bulk role creation with comprehensive validation and error handling
     *
     * @param request - Bulk creation request with roles and options
     * @returns Promise resolving to detailed bulk creation response
     * @throws ApplicationError when critical validation fails
     */
    async execute(request: BulkCreateRolesRequest): Promise<BulkCreateRolesResponse> {
        const startTime = this.clock.nowEpochSeconds();

        try {
            // Phase 1: Validate bulk operation constraints
            this.validateBulkConstraints(request);

            // Phase 2: Handle validation-only mode
            if (request.validateOnly) {
                return await this.performValidationOnly(request, startTime);
            }

            // Phase 3: Execute bulk creation with optimized processing
            return await this.performBulkCreation(request, startTime);
        } catch (error: unknown) {
            return this.handleCriticalError(request, error, startTime);
        }
    }

    /**
     * Validate bulk operation constraints and business rules
     */
    private validateBulkConstraints(request: BulkCreateRolesRequest): void {
        const maxBatchSize = request.maxBatchSize || 100;

        if (!request.roles || request.roles.length === 0) {
            throw new ApplicationError(
                'bulk_create_roles',
                'EMPTY_BATCH',
                'Bulk creation requires at least one role'
            );
        }

        if (request.roles.length > maxBatchSize) {
            throw new ApplicationError(
                'bulk_create_roles',
                'BATCH_SIZE_EXCEEDED',
                `Batch size ${request.roles.length} exceeds maximum allowed ${maxBatchSize}`
            );
        }

        if (!request.requestedBy || typeof request.requestedBy !== 'number') {
            throw new ApplicationError(
                'bulk_create_roles',
                'INVALID_REQUESTER',
                'Valid requester ID is required for bulk operations'
            );
        }
    }

    /**
     * Perform validation-only mode processing
     */
    private async performValidationOnly(
        request: BulkCreateRolesRequest,
        startTime: number
    ): Promise<BulkCreateRolesResponse> {
        const results: RoleCreationResult[] = [];
        let duplicateDetections = 0;

        // Get existing roles for duplicate checking
        const existingRoles = await this.roleRepo.list();
        const existingNames = new Set(existingRoles.map((r) => r.name.toLowerCase()));
        const batchNames = new Set<string>();

        for (let i = 0; i < request.roles.length; i++) {
            const roleData = request.roles[i];
            const validationResult = this.validateIndividualRole(
                roleData,
                i,
                existingNames,
                batchNames
            );

            if (!validationResult.success && validationResult.isDuplicate) {
                duplicateDetections++;
            }

            results.push(validationResult);

            if (validationResult.success) {
                batchNames.add(roleData.name.toLowerCase());
            }
        }

        const endTime = this.clock.nowEpochSeconds();
        const successful = results.filter((r) => r.success).length;

        return {
            results,
            summary: {
                total: request.roles.length,
                successful,
                failed: request.roles.length - successful,
                skipped: 0,
            },
            transactionId: request.transactionId,
            performance: {
                executionTime: endTime - startTime,
                averageTime: (endTime - startTime) / request.roles.length,
                duplicateDetections,
            },
        };
    }

    /**
     * Perform actual bulk creation with optimized processing
     */
    private async performBulkCreation(
        request: BulkCreateRolesRequest,
        startTime: number
    ): Promise<BulkCreateRolesResponse> {
        const results: RoleCreationResult[] = [];
        let successful = 0;
        let failed = 0;
        let skipped = 0;
        let duplicateDetections = 0;

        // Pre-load existing roles for duplicate checking
        const existingRoles = await this.roleRepo.list();
        const existingNames = new Set(existingRoles.map((r) => r.name.toLowerCase()));
        const batchNames = new Set<string>();

        // Process each role with individual error handling
        for (let i = 0; i < request.roles.length; i++) {
            const roleData = request.roles[i];

            try {
                // Validate individual role
                const validationResult = this.validateIndividualRole(
                    roleData,
                    i,
                    existingNames,
                    batchNames
                );

                if (!validationResult.success) {
                    if (validationResult.isDuplicate) {
                        duplicateDetections++;
                    }
                    results.push(validationResult);
                    skipped++;
                    continue;
                }

                // Create role contract
                const roleContract: CreateRoleContract = {
                    name: roleData.name,
                    accessLevel: roleData.accessLevel,
                    description: roleData.description,
                    canLeadProjects: roleData.canLeadProjects,
                    isUniquePerTeam: roleData.isUniquePerTeam,
                };

                // Attempt role creation
                const role = await this.roleRepo.create(roleContract);

                batchNames.add(roleData.name.toLowerCase());
                results.push({
                    index: i,
                    name: roleData.name,
                    success: true,
                    role,
                    retryable: false,
                });
                successful++;
            } catch (error: unknown) {
                const errorResult = this.handleIndividualCreationError(roleData, i, error);
                results.push(errorResult);
                failed++;

                // Break on critical errors if not continuing on error
                if (!request.continueOnError && this.isCriticalError(error)) {
                    break;
                }
            }
        }

        const endTime = this.clock.nowEpochSeconds();

        // Log bulk operation completion
        this.logBulkOperationCompletion(request, {
            total: request.roles.length,
            successful,
            failed,
            skipped,
            duplicateDetections,
            executionTime: endTime - startTime,
        });

        return {
            results,
            summary: {
                total: request.roles.length,
                successful,
                failed,
                skipped,
            },
            transactionId: request.transactionId,
            performance: {
                executionTime: endTime - startTime,
                averageTime: (endTime - startTime) / request.roles.length,
                duplicateDetections,
            },
        };
    }

    /**
     * Validate individual role within batch context
     */
    private validateIndividualRole(
        roleData: RoleCreationData,
        index: number,
        existingNames: Set<string>,
        batchNames: Set<string>
    ): RoleCreationResult & { isDuplicate?: boolean } {
        // Basic field validation
        if (
            !roleData.name ||
            typeof roleData.name !== 'string' ||
            roleData.name.trim().length === 0
        ) {
            return {
                index,
                name: roleData.name || '',
                success: false,
                error: 'Role name is required and must be a non-empty string',
                conflictFields: ['name'],
                retryable: true,
            };
        }

        if (
            typeof roleData.accessLevel !== 'number' ||
            roleData.accessLevel < 0 ||
            roleData.accessLevel > 5
        ) {
            return {
                index,
                name: roleData.name,
                success: false,
                error: 'Access level must be a number between 0 and 5',
                conflictFields: ['accessLevel'],
                retryable: true,
            };
        }

        // Duplicate checking
        const normalizedName = roleData.name.toLowerCase();

        if (batchNames.has(normalizedName)) {
            return {
                index,
                name: roleData.name,
                success: false,
                error: 'Duplicate role name within batch',
                conflictFields: ['name'],
                retryable: false,
                isDuplicate: true,
            };
        }

        if (existingNames.has(normalizedName)) {
            return {
                index,
                name: roleData.name,
                success: false,
                error: 'Role name already exists in system',
                conflictFields: ['name'],
                retryable: false,
                isDuplicate: true,
            };
        }

        return {
            index,
            name: roleData.name,
            success: true,
            retryable: false,
        };
    }

    /**
     * Handle individual role creation errors
     */
    private handleIndividualCreationError(
        roleData: RoleCreationData,
        index: number,
        error: unknown
    ): RoleCreationResult {
        const normalizedError = this.errorTransformer.transformError(error, {
            operation: 'bulk_create_roles_individual',
            feature: 'roles',
        });

        return {
            index,
            name: roleData.name,
            success: false,
            error: normalizedError || 'Unknown creation error',
            retryable: !this.isCriticalError(error),
        };
    }

    /**
     * Determine if error is critical and should stop batch processing
     */
    private isCriticalError(error: unknown): boolean {
        // Consider database connection errors, permission errors as critical
        return (
            error instanceof Error &&
            (error.message.includes('connection') ||
                error.message.includes('permission') ||
                error.message.includes('unauthorized'))
        );
    }

    /**
     * Handle critical errors that prevent bulk operation continuation
     */
    private handleCriticalError(
        request: BulkCreateRolesRequest,
        error: unknown,
        startTime: number
    ): BulkCreateRolesResponse {
        const endTime = this.clock.nowEpochSeconds();
        const normalizedError = this.errorTransformer.transformError(error, {
            operation: 'bulk_create_roles',
            feature: 'roles',
        });

        // Log critical error
        console.error(`[AUDIT] Bulk role creation critical error`, {
            timestamp: endTime,
            requestedBy: request.requestedBy,
            error: normalizedError,
            batchSize: request.roles.length,
            executionTime: endTime - startTime,
            operation: 'bulk_create_roles',
            feature: 'roles',
            severity: 'CRITICAL',
        });

        return {
            results: [],
            summary: {
                total: request.roles.length,
                successful: 0,
                failed: request.roles.length,
                skipped: 0,
            },
            transactionId: request.transactionId,
            performance: {
                executionTime: endTime - startTime,
                averageTime: 0,
                duplicateDetections: 0,
            },
        };
    }

    /**
     * Log bulk operation completion with detailed metrics
     */
    private logBulkOperationCompletion(
        request: BulkCreateRolesRequest,
        metrics: {
            total: number;
            successful: number;
            failed: number;
            skipped: number;
            duplicateDetections: number;
            executionTime: number;
        }
    ): void {
        const timestamp = this.clock.nowEpochSeconds();

        console.log(`[AUDIT] Bulk role creation completed`, {
            timestamp,
            requestedBy: request.requestedBy,
            transactionId: request.transactionId,
            results: {
                ...metrics,
                successRate: (metrics.successful / metrics.total) * 100,
                averageTimePerRole: metrics.executionTime / metrics.total,
            },
            operation: 'bulk_create_roles',
            feature: 'roles',
            severity: 'MEDIUM',
        });
    }
}
