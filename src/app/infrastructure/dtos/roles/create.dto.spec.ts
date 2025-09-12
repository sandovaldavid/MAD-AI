import { CreateRoleRequestDTO, CreateRoleResponseDTO } from './create.dto';

describe('CreateRole DTOs', () => {
  describe('CreateRoleRequestDTO', () => {
    it('should create an instance', () => {
      const dto: CreateRoleRequestDTO = {
        name: 'Admin',
        description: 'Administrator role',
        access_level: 1,
        can_lead_projects: true,
        is_unique_per_team: false,
        created_by_user_id: 1,
      };
      expect(dto).toBeDefined();
      expect(dto.name).toBe('Admin');
    });
  });

  describe('CreateRoleResponseDTO', () => {
    it('should create an instance', () => {
      const dto: CreateRoleResponseDTO = {
        id: 1,
        name: 'Admin',
        description: 'Administrator role',
        access_level: 1,
        can_lead_projects: true,
        is_unique_per_team: false,
        is_active: true,
        created_at: '2025-09-12T00:00:00Z',
        user_count: 0,
      };
      expect(dto).toBeDefined();
      expect(dto.id).toBe(1);
    });
  });
});
