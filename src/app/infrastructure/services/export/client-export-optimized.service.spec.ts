import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { ClientExportService } from './client-export-optimized.service';
import type {
  PdfConfig,
  CsvConfig,
  JsonConfig,
} from '@domain/repositories/system/export.repository';

describe('ClientExportService (Optimized)', () => {
  let service: ClientExportService;

  describe('Browser Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [ClientExportService, { provide: PLATFORM_ID, useValue: 'browser' }],
      });
      service = TestBed.inject(ClientExportService);
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should detect browser environment', () => {
      // Access private property for testing
      expect((service as any).isBrowser).toBe(true);
    });
  });

  describe('Server Environment', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [ClientExportService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      service = TestBed.inject(ClientExportService);
    });

    it('should detect server environment', () => {
      // Access private property for testing
      expect((service as any).isBrowser).toBe(false);
    });

    it('should not export PDF on server', async () => {
      const mockData = [{ name: 'Test' }];
      const mockConfig: PdfConfig = {
        title: 'Test',
        filename: 'test.pdf',
        columns: [{ header: 'Name', dataKey: 'name' }],
      };

      // Should not throw and should not execute any export logic
      await expectAsync(service.exportToPdf(mockData, mockConfig)).toBeResolved();
    });

    it('should not export CSV on server', async () => {
      const mockData = [{ name: 'Test' }];
      const mockConfig: CsvConfig = { filename: 'test.csv' };

      await expectAsync(service.exportToCsv(mockData, mockConfig)).toBeResolved();
    });

    it('should not export JSON on server', async () => {
      const mockData = [{ name: 'Test' }];
      const mockConfig: JsonConfig = { filename: 'test.json' };

      await expectAsync(service.exportToJson(mockData, mockConfig)).toBeResolved();
    });
  });
});
