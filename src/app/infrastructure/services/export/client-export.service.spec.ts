import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { ClientExportService } from './client-export.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type {
  JsonConfig,
  CsvConfig,
  PdfConfig,
} from '@domain/repositories/system/export.repository';
import { CellHookData } from 'jspdf-autotable';

describe('ClientExportService', () => {
  let service: ClientExportService;
  let downloadFileSpy: jasmine.Spy;

  let mockJsPDFInstance: any;
  let mockJsPDF: any;
  let mockAutoTable: any;
  let mockPapa: any;

  const configureTestBed = (platform: 'browser' | 'server') => {
    TestBed.configureTestingModule({
      providers: [
        ClientExportService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: platform },
      ],
    });

    service = TestBed.inject(ClientExportService);

    mockJsPDFInstance = {
      setFontSize: jasmine.createSpy('setFontSize'),
      setFont: jasmine.createSpy('setFont'),
      text: jasmine.createSpy('text'),
      save: jasmine.createSpy('save'),
    };
    mockJsPDF = jasmine.createSpy('jsPDF').and.returnValue(mockJsPDFInstance);
    mockAutoTable = jasmine.createSpy('autoTable');
    mockPapa = {
      unparse: jasmine.createSpy('unparse').and.returnValue('csv,content'),
    };

    (service as any).jspdf = { jsPDF: mockJsPDF };
    (service as any).jspdfAutoTable = { autoTable: mockAutoTable };
    (service as any).papa = mockPapa;

    downloadFileSpy = spyOn(service, 'downloadFile').and.callFake(() => {});
  };

  describe('when in a browser environment', () => {
    beforeEach(() => {
      configureTestBed('browser');
    });

    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    describe('exportToJson', () => {
      it('should handle prettified JSON export', async () => {
        // Arrange
        const data = [{ a: 1, b: 'test' }];
        const config: JsonConfig = { filename: 'pretty.json', prettify: true };
        const expectedJson = JSON.stringify(data, null, 2);

        // Act
        await service.exportToJson(data, config);

        // Assert
        expect(downloadFileSpy).toHaveBeenCalledWith(
          expectedJson,
          'pretty.json',
          'application/json'
        );
      });

      it('should handle minified JSON export', async () => {
        // Arrange
        const data = [{ a: 1, b: 'test' }];
        const config: JsonConfig = { filename: 'minified.json', prettify: false };
        const expectedJson = JSON.stringify(data);

        // Act
        await service.exportToJson(data, config);

        // Assert
        expect(downloadFileSpy).toHaveBeenCalledWith(
          expectedJson,
          'minified.json',
          'application/json'
        );
      });
    });

    describe('exportToCsv', () => {
      it('should use a custom delimiter and no headers', async () => {
        // Arrange
        const data = [{ a: 1, b: 'hello' }];
        const config: CsvConfig = { filename: 'test.csv', delimiter: ';', includeHeaders: false };

        // Act
        await service.exportToCsv(data, config);

        // Assert
        expect(mockPapa.unparse).toHaveBeenCalledWith(data, {
          delimiter: ';',
          header: false,
          skipEmptyLines: true,
        });
      });

      it('should correctly map data when specific headers are provided', async () => {
        // Arrange
        const data = [{ id: 1, name: 'John', contact: { email: 'john@a.com' } }];
        const config: CsvConfig = { filename: 'test.csv', headers: ['name', 'contact.email'] };
        const expectedMappedData = [{ name: 'John', 'contact.email': 'john@a.com' }];

        // Act
        await service.exportToCsv(data, config);

        // Assert
        expect(mockPapa.unparse).toHaveBeenCalledWith(expectedMappedData, jasmine.any(Object));
      });

      it('should use default CSV configuration when minimal config provided', async () => {
        // Arrange
        const data = [{ id: 1, name: 'Test' }];
        const minimalConfig: CsvConfig = { filename: 'export.csv' };

        // Act
        await service.exportToCsv(data, minimalConfig);

        // Assert
        expect(mockPapa.unparse).toHaveBeenCalledWith(data, {
          delimiter: ',',
          header: true,
          skipEmptyLines: true,
        });
      });
    });

    describe('exportToPdf', () => {
      it('should use custom PDF options', async () => {
        // Arrange
        const config: PdfConfig = {
          filename: 'test.pdf',
          title: 'Test Report',
          columns: [],
          orientation: 'landscape',
          pageSize: 'letter',
          headerColor: '#ff0000',
          alternateRowColors: true,
        };

        // Act
        await service.exportToPdf([], config);

        // Assert
        expect(mockJsPDF).toHaveBeenCalledWith({
          orientation: 'landscape',
          unit: 'mm',
          format: 'letter',
        });
        expect(mockAutoTable).toHaveBeenCalledWith(
          mockJsPDFInstance,
          jasmine.objectContaining({
            headStyles: jasmine.objectContaining({ fillColor: [255, 0, 0] }),
            alternateRowStyles: { fillColor: [248, 250, 252] },
          })
        );
      });

      it('should trigger didParseCell and modify styles', async () => {
        // Arrange
        const config: PdfConfig = { filename: 'test.pdf', title: 'Test', columns: [] };

        // Act
        await service.exportToPdf([{}], config);

        // Assert - Get the options passed to autoTable
        const autoTableArgs = mockAutoTable.calls.mostRecent().args;
        const autoTableOptions = autoTableArgs[1];

        // Arrange - Mock data for callback
        const mockCellHookData = {
          section: 'body',
          cell: { styles: { textColor: [0, 0, 0] } },
        } as CellHookData;

        // Act - Trigger the callback
        autoTableOptions.didParseCell(mockCellHookData);

        // Assert - Verify callback modified the styles
        expect(mockCellHookData.cell.styles.textColor).toEqual([51, 65, 85]);
      });

      it('should correctly configure jsPDF with all custom options', async () => {
        // Arrange
        const config: PdfConfig = {
          filename: 'report.pdf',
          title: 'Sales Report',
          columns: [
            { header: 'Product', dataKey: 'name', width: 50 },
            { header: 'Price', dataKey: 'price', width: 30 },
          ],
          orientation: 'portrait',
          pageSize: 'a4',
        };
        const data = [
          { name: 'Laptop', price: 999 },
          { name: 'Mouse', price: 25 },
        ];

        // Act
        await service.exportToPdf(data, config);

        // Assert - Verify jsPDF configuration
        expect(mockJsPDF).toHaveBeenCalledWith({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Assert - Verify autoTable receives correct column styles
        const autoTableCall = mockAutoTable.calls.mostRecent().args[1];
        expect(autoTableCall.columnStyles).toEqual({
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
        });
      });

      it('should handle default PDF options and varied data types', async () => {
        // Arrange
        const config: PdfConfig = {
          title: '', // Use empty string to satisfy type, but test falsy path
          filename: 'defaults.pdf',
          columns: [
            { header: 'ID', dataKey: 'id' },
            { header: 'Active', dataKey: 'isActive' },
            { header: 'Extra', dataKey: 'extra' },
            { header: 'Missing', dataKey: 'missing' },
            { header: 'Obj', dataKey: 'obj' },
          ],
          alternateRowColors: false,
        };
        const data = [
          { id: 1, isActive: true, extra: null, missing: undefined, obj: { key: 'val' } },
        ];
        const expectedTableData = [[1, true, null, null, '[object Object]']];

        // Act
        await service.exportToPdf(data, config);

        // Assert
        // Check that the title-specific font size was not set
        expect(mockJsPDFInstance.setFontSize).not.toHaveBeenCalledWith(16);

        const autoTableArgs = mockAutoTable.calls.mostRecent().args;
        const autoTableOptions = autoTableArgs[1];
        expect(autoTableOptions.startY).toBe(20);
        expect(autoTableOptions.headStyles.fillColor).toEqual([71, 85, 105]);
        expect(autoTableOptions.alternateRowStyles).toBeUndefined();
        expect(autoTableOptions.body).toEqual(expectedTableData);
        expect(mockJsPDFInstance.save).toHaveBeenCalledWith('defaults.pdf');
      });

      it('should not apply body styles to head cells in didParseCell', async () => {
        // Arrange
        const config: PdfConfig = { filename: 'test.pdf', title: 'Test', columns: [] };

        // Act
        await service.exportToPdf([{}], config);

        // Assert
        const autoTableArgs = mockAutoTable.calls.mostRecent().args;
        const autoTableOptions = autoTableArgs[1];

        // Arrange for callback
        const mockCellHookData = {
          section: 'head',
          cell: { styles: { textColor: [255, 255, 255] } },
        } as CellHookData;

        // Act
        autoTableOptions.didParseCell(mockCellHookData);

        // Assert
        expect(mockCellHookData.cell.styles.textColor).toEqual([255, 255, 255]);
      });
    });
  });

  // Minimal server-side tests to ensure no-op
  describe('when in a server environment', () => {
    beforeEach(() => {
      configureTestBed('server');
    });

    it('exportToPdf should do nothing', async () => {
      // Arrange
      const config: PdfConfig = { filename: 'test.pdf', title: 'Test PDF', columns: [] };

      // Act
      await service.exportToPdf([], config);

      // Assert
      expect(mockJsPDFInstance.save).not.toHaveBeenCalled();
    });

    it('exportToCsv should do nothing', async () => {
      // Arrange
      const config: CsvConfig = { filename: 'test.csv' };

      // Act
      await service.exportToCsv([], config);

      // Assert
      expect(mockPapa.unparse).not.toHaveBeenCalled();
    });
  });

  describe('private helper methods', () => {
    /**
     * Note: These private methods are tested directly because:
     * 1. They are pure utility functions without side effects
     * 2. Their logic is critical for the correct functioning of the service
     * 3. Testing them in isolation allows better coverage of edge cases
     *
     * According to the guide, this is acceptable for pure utilities in the Infrastructure Layer.
     */
    beforeEach(() => {
      configureTestBed('browser');
    });

    describe('getNestedProperty', () => {
      const testObj = { a: { b: { c: 123 } }, d: 'hello', e: null };

      it('should retrieve a top-level property', () => {
        // Arrange
        const path = 'd';

        // Act
        const result = (service as any).getNestedProperty(testObj, path);

        // Assert
        expect(result).toBe('hello');
      });

      it('should retrieve a nested property', () => {
        // Arrange
        const path = 'a.b.c';

        // Act
        const result = (service as any).getNestedProperty(testObj, path);

        // Assert
        expect(result).toBe(123);
      });

      it('should return null for a non-existent path', () => {
        // Arrange
        const path = 'a.x.y';

        // Act
        const result = (service as any).getNestedProperty(testObj, path);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null when path goes through a null value', () => {
        // Arrange
        const path = 'e.f';

        // Act
        const result = (service as any).getNestedProperty(testObj, path);

        // Assert
        expect(result).toBeNull();
      });

      it('should return null for an invalid object', () => {
        // Arrange
        const obj = null;
        const path = 'a.b';

        // Act
        const result = (service as any).getNestedProperty(obj, path);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe('hexToRgb', () => {
      it('should convert a valid hex color to an RGB array', () => {
        // Arrange
        const hexColor = '#ff0000';

        // Act
        const result = (service as any).hexToRgb(hexColor);

        // Assert
        expect(result).toEqual([255, 0, 0]);
      });

      it('should return a default color for an invalid hex string', () => {
        // Arrange
        const invalidHex = 'invalid';

        // Act
        const result = (service as any).hexToRgb(invalidHex);

        // Assert
        expect(result).toEqual([71, 85, 105]);
      });
    });

    describe('buildColumnStyles', () => {
      it('should create styles for columns with specified widths', () => {
        // Arrange
        const columns = [{ width: 50 }, {}, { width: 100 }];

        // Act
        const result = (service as any).buildColumnStyles(columns);

        // Assert
        expect(result).toEqual({ 0: { cellWidth: 50 }, 2: { cellWidth: 100 } });
      });

      it('should create an empty object if no columns have width', () => {
        // Arrange
        const columns = [{}, { header: 'test' }];

        // Act
        const result = (service as any).buildColumnStyles(columns);

        // Assert
        expect(result).toEqual({});
      });
    });
  });

  describe('Error handling', () => {
    beforeEach(() => {
      configureTestBed('browser');
    });

    describe('CSV export errors', () => {
      it('should handle CSV parsing errors gracefully', async () => {
        // Arrange
        mockPapa.unparse.and.throwError(new Error('Papa parse error'));
        const data = [{ test: 'data' }];
        const config: CsvConfig = { filename: 'test.csv' };

        // Act & Assert
        await expectAsync(service.exportToCsv(data, config)).toBeRejectedWithError(
          'Papa parse error'
        );
      });

      it('should handle empty data array for CSV export', async () => {
        // Arrange
        const emptyData: any[] = [];
        const config: CsvConfig = { filename: 'empty.csv' };

        // Act
        await service.exportToCsv(emptyData, config);

        // Assert
        expect(mockPapa.unparse).toHaveBeenCalledWith([], jasmine.any(Object));
        expect(downloadFileSpy).toHaveBeenCalled();
      });
    });

    describe('PDF export errors', () => {
      it('should handle PDF generation errors gracefully', async () => {
        // Arrange
        mockJsPDFInstance.save.and.throwError(new Error('PDF save error'));
        const data = [{ test: 'data' }];
        const config: PdfConfig = {
          filename: 'test.pdf',
          title: 'Test',
          columns: [{ header: 'Test', dataKey: 'test' }],
        };

        // Act & Assert
        await expectAsync(service.exportToPdf(data, config)).toBeRejectedWithError(
          'PDF save error'
        );
      });

      it('should handle empty data array for PDF export', async () => {
        // Arrange
        const emptyData: any[] = [];
        const config: PdfConfig = {
          filename: 'empty.pdf',
          title: 'Empty Report',
          columns: [],
        };

        // Act
        await service.exportToPdf(emptyData, config);

        // Assert
        expect(mockJsPDF).toHaveBeenCalled();
        expect(mockAutoTable).toHaveBeenCalled();
        expect(mockJsPDFInstance.save).toHaveBeenCalledWith('empty.pdf');
      });
    });

    describe('JSON export errors', () => {
      it('should handle circular reference in JSON data', async () => {
        // Arrange
        const circularObj: any = { a: 1 };
        circularObj.circular = circularObj;
        const config: JsonConfig = { filename: 'circular.json' };

        // Act & Assert
        try {
          await service.exportToJson([circularObj], config);
          fail('Should have thrown an error');
        } catch (error: any) {
          expect(error.message).toMatch(/circular|cyclic/i);
        }
      });
    });
  });
});
