/**
 * @fileoverview Basic Integration Test for Refactored Users Facade
 *
 * This test file verifies that the new facade structure is properly integrated
 * and that the main UsersFacade can be instantiated and provides the expected API.
 *
 * @author MAD-AI Development Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import { TestBed } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

// Import the main facade and specialized facades
import { UsersFacade } from '@application/facades/users/user.facade';
import { UserCrudFacade } from '@application/facades/users/user-crud.facade';
import { UserLookupFacade } from '@application/facades/users/user-lookup.facade';
import { UserListFacade } from '@application/facades/users/user-list.facade';
import { UserStateFacade } from '@application/facades/users/user-state.facade';
import { UserUtilsFacade } from '@application/facades/users/user-utils.facade';

// Import providers
import { provideUsers } from '@di/provide-users';

describe('Users Facade Integration Test', () => {
  let usersFacade: UsersFacade;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideUsers()],
    });

    usersFacade = TestBed.inject(UsersFacade);
  });

  it('should create the main UsersFacade', () => {
    expect(usersFacade).toBeTruthy();
    expect(usersFacade).toBeInstanceOf(UsersFacade);
  });

  it('should have all expected CRUD methods', () => {
    expect(typeof usersFacade.createUser).toBe('function');
    expect(typeof usersFacade.updateUser).toBe('function');
    expect(typeof usersFacade.deleteUser).toBe('function');
  });

  it('should have all expected lookup methods', () => {
    expect(typeof usersFacade.getUserById).toBe('function');
    expect(typeof usersFacade.getUserByEmail).toBe('function');
    expect(typeof usersFacade.getUserByUsername).toBe('function');
    expect(typeof usersFacade.findUser).toBe('function');
  });

  it('should have all expected list methods', () => {
    expect(typeof usersFacade.listUsers).toBe('function');
    expect(typeof usersFacade.searchUsers).toBe('function');
  });

  it('should have all expected state management methods', () => {
    expect(typeof usersFacade.activateUser).toBe('function');
    expect(typeof usersFacade.deactivateUser).toBe('function');
    expect(typeof usersFacade.toggleUserStatus).toBe('function');
    expect(typeof usersFacade.activateUsers).toBe('function');
    expect(typeof usersFacade.deactivateUsers).toBe('function');
  });

  it('should have all expected utility methods', () => {
    expect(typeof usersFacade.selectUser).toBe('function');
    expect(typeof usersFacade.clearSelection).toBe('function');
    expect(typeof usersFacade.selectUserById).toBe('function');
    expect(typeof usersFacade.clearError).toBe('function');
    expect(typeof usersFacade.hasError).toBe('function');
    expect(typeof usersFacade.reset).toBe('function');
    expect(typeof usersFacade.refresh).toBe('function');
    expect(typeof usersFacade.initialize).toBe('function');
    expect(typeof usersFacade.getUserCountStats).toBe('function');
    expect(typeof usersFacade.isLoading).toBe('function');
  });

  it('should have all expected enhanced operation methods', () => {
    expect(typeof usersFacade.createAndSelectUser).toBe('function');
    expect(typeof usersFacade.updateAndSelectUser).toBe('function');
    expect(typeof usersFacade.deleteSelectedUser).toBe('function');
  });

  it('should have access to reactive state signals', () => {
    expect(typeof usersFacade.users).toBe('function');
    expect(typeof usersFacade.selectedUser).toBe('function');
    expect(typeof usersFacade.loading).toBe('function');
    expect(typeof usersFacade.error).toBe('function');
    expect(typeof usersFacade.totalCount).toBe('function');
    expect(typeof usersFacade.hasUsers).toBe('function');
  });

  it('should allow all specialized facades to be injected independently', () => {
    const crudFacade = TestBed.inject(UserCrudFacade);
    const lookupFacade = TestBed.inject(UserLookupFacade);
    const listFacade = TestBed.inject(UserListFacade);
    const stateFacade = TestBed.inject(UserStateFacade);
    const utilsFacade = TestBed.inject(UserUtilsFacade);

    expect(crudFacade).toBeTruthy();
    expect(lookupFacade).toBeTruthy();
    expect(listFacade).toBeTruthy();
    expect(stateFacade).toBeTruthy();
    expect(utilsFacade).toBeTruthy();
  });

  it('should maintain backward compatibility with original facade API', () => {
    // Verify that the facade provides the same interface as the original
    // This ensures that existing code using UsersFacade will continue to work
    expect(usersFacade.createUser).toBeDefined();
    expect(usersFacade.updateUser).toBeDefined();
    expect(usersFacade.deleteUser).toBeDefined();
    expect(usersFacade.getUserById).toBeDefined();
    expect(usersFacade.listUsers).toBeDefined();
    expect(usersFacade.activateUser).toBeDefined();
    expect(usersFacade.selectUser).toBeDefined();
    expect(usersFacade.reset).toBeDefined();
  });
});
