import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  OnInit,
  OnDestroy,
  inject,
  ElementRef,
  Renderer2,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// Shared UI Components
import { Button } from '@presentation/shared/ui/button/button';
import { Icon } from '@presentation/shared/ui/icon/icon';

/**
 * Acciones masivas disponibles para la barra de herramientas
 */
export interface BulkAction {
  id: string;
  label: string;
  icon: string;
  description?: string;
  variant: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost';
  requiresConfirmation?: boolean;
  minimumSelection?: number;
  maximumSelection?: number;
  hotkey?: string;
}

/**
 * Opciones de formato de exportación
 */
export interface ExportFormat {
  id: string;
  label: string;
  icon: string;
  extension: string;
  mimeType: string;
}

/**
 * Elemento de estadística personalizable
 */
export interface StatItem {
  key: string;
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

/**
 * Estadísticas para elementos seleccionados
 */
export interface SelectionStats {
  total: number;
  items?: StatItem[];
  [key: string]: unknown;
}

/**
 * Configuración de textos personalizables
 */
export interface BulkToolbarTexts {
  selectedItems?: string;
  advancedActionsTitle?: string;
  exportOptionsTitle?: string;
  toggleMore?: string;
  toggleLess?: string;
  clearTooltip?: string;
  toggleTooltip?: string;
  shortcutsHint?: string;
}

/**
 * Configuración de iconos personalizables
 */
export interface BulkToolbarIcons {
  selection?: string;
  advancedSection?: string;
  exportSection?: string;
  toggleExpand?: string;
  toggleCollapse?: string;
  clear?: string;
}

/**
 * Componente profesional de barra de herramientas flotante para acciones masivas
 *
 * Características:
 * - Animación deslizante desde abajo
 * - Acciones rápidas para operaciones comunes
 * - Panel expandible de acciones avanzadas
 * - Funcionalidad de exportación con múltiples formatos
 * - Visualización de estadísticas de selección
 * - Soporte para atajos de teclado
 * - Diseño responsivo
 * - Interfaz profesional y experiencia de usuario
 */
@Component({
  selector: 'ui-bulk-actions-toolbar',
  standalone: true,
  imports: [CommonModule, Button, Icon],
  templateUrl: './bulk-actions-toolbar.html',
  styleUrl: './bulk-actions-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkActionsToolbar implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  // ============================================================================
  // Entradas
  // ============================================================================

  /** Número de elementos seleccionados */
  selectedCount = input.required<number>();

  /** Acciones rápidas a mostrar en la barra principal */
  quickActions = input<BulkAction[]>([]);

  /** Acciones avanzadas disponibles en el panel expandible */
  advancedActions = input<BulkAction[]>([]);

  /** Formatos de exportación disponibles */
  exportFormats = input<ExportFormat[]>([]);

  /** Estadísticas para elementos seleccionados */
  selectionStats = input<SelectionStats>({ total: 0 });

  /** ID de acción en ejecución actualmente */
  executingAction = input<string | null>(null);

  /** Título personalizado para la barra de herramientas */
  title = input<string>('elementos seleccionados');

  /** Habilitar/deshabilitar atajos de teclado */
  enableHotkeys = input<boolean>(true);

  /** Mostrar opciones de exportación */
  showExportOptions = input<boolean>(true);

  /** Mostrar opción rápida de exportación en la barra principal */
  showQuickExport = input<boolean>(false);

  /** Mostrar estadísticas */
  showStatistics = input<boolean>(true);

  /** Mostrar alternar acciones avanzadas */
  showAdvancedToggle = input<boolean>(true);

  /** Clases CSS personalizadas */
  customClass = input<string>('');

  /** Textos personalizables */
  texts = input<BulkToolbarTexts>({});

  /** Iconos personalizables */
  icons = input<BulkToolbarIcons>({});

  /** Posición de la toolbar */
  position = input<'bottom' | 'top'>('bottom');

  /** Mostrar información de selección */
  showSelectionInfo = input<boolean>(true);

  // ============================================================================
  // Salidas
  // ============================================================================

  /** Se emite cuando se activa una acción rápida */
  quickActionTriggered = output<{ actionId: string; selectedCount: number }>();

  /** Se emite cuando se activa una acción avanzada */
  advancedActionTriggered = output<{ actionId: string; selectedCount: number }>();

  /** Se emite cuando se solicita exportación */
  exportRequested = output<{ format: string; selectedCount: number }>();

  /** Se emite cuando la selección debe ser limpiada */
  clearSelection = output<void>();

  /** Se emite cuando el panel avanzado se alterna */
  advancedToggled = output<boolean>();

  // ============================================================================
  // Estado Interno
  // ============================================================================

  private _showAdvanced = signal<boolean>(false);
  private _showShortcutsHint = signal<boolean>(false);
  private _shortcutsHintTimer: ReturnType<typeof setTimeout> | null = null;
  private _keyboardListeners: (() => void)[] = [];

  // ============================================================================
  // Propiedades Computadas
  // ============================================================================

  /** Si la barra de herramientas debe ser visible */
  readonly isVisible = computed(() => this.selectedCount() > 0);

  /** Si el panel avanzado se muestra */
  readonly showAdvanced = computed(() => this._showAdvanced());

  /** Si la pista de atajos debe mostrarse */
  readonly showShortcutsHint = computed(
    () => this.enableHotkeys() && this.isVisible() && this._showShortcutsHint()
  );

  /** Clases CSS para animación de visibilidad de barra de herramientas */
  readonly toolbarClasses = computed(() => ({
    'toolbar-visible': this.isVisible(),
    'toolbar-hidden': !this.isVisible(),
  }));

  /** Clases CSS para animación del panel avanzado */
  readonly advancedClasses = computed(() => ({
    'panel-expanded': this.showAdvanced(),
    'panel-collapsed': !this.showAdvanced(),
  }));

  /** Acciones rápidas filtradas basadas en el conteo de selección */
  readonly availableQuickActions = computed(() => {
    const count = this.selectedCount();
    return this.quickActions().filter(
      (action) =>
        (!action.minimumSelection || count >= action.minimumSelection) &&
        (!action.maximumSelection || count <= action.maximumSelection)
    );
  });

  /** Acciones avanzadas filtradas basadas en el conteo de selección */
  readonly availableAdvancedActions = computed(() => {
    const count = this.selectedCount();
    return this.advancedActions().filter(
      (action) =>
        (!action.minimumSelection || count >= action.minimumSelection) &&
        (!action.maximumSelection || count <= action.maximumSelection)
    );
  });

  /** Si hay acciones avanzadas disponibles */
  readonly hasAdvancedActions = computed(() => this.availableAdvancedActions().length > 0);

  /** Si el panel expandible debe mostrarse (acciones avanzadas o múltiples formatos de exportación) */
  readonly shouldShowExpandablePanel = computed(() =>
    this.hasAdvancedActions() || (this.showExportOptions() && this.exportFormats().length > 1)
  );

  /** Texto de resumen de selección */
  readonly selectionSummary = computed(() => {
    const count = this.selectedCount();
    const title = this.texts().selectedItems || this.title();
    return `${count} ${title}`;
  });

  /** Configuración de textos con valores por defecto */
  readonly defaultTexts = computed(() => ({
    selectedItems: 'elementos seleccionados',
    advancedActionsTitle: 'Acciones Avanzadas',
    exportOptionsTitle: 'Opciones de Exportación',
    toggleMore: 'Más',
    toggleLess: 'Menos',
    clearTooltip: 'Limpiar selección (Esc o X)',
    toggleTooltip: 'Alternar panel expandible (E)',
    shortcutsHint: 'Presiona Esc para limpiar, E para expandir',
    ...this.texts(),
  }));

  /** Configuración de iconos con valores por defecto */
  readonly defaultIcons = computed(() => ({
    selection: 'check-circle',
    advancedSection: 'server',
    exportSection: 'download',
    toggleExpand: 'chevron-up',
    toggleCollapse: 'chevron-down',
    clear: 'x-mark',
    ...this.icons(),
  }));

  /** Estadísticas personalizadas disponibles */
  readonly customStats = computed(() => {
    const stats = this.selectionStats();
    return stats.items || [];
  });

  // ============================================================================
  // Ciclo de Vida
  // ============================================================================

  ngOnInit() {
    this.setupKeyboardShortcuts();
    this.positionToolbar();
    this.setupResponsiveLayout();

    // Mostrar pista de atajos brevemente cuando la barra aparece por primera vez
    if (this.isVisible()) {
      setTimeout(() => this.showShortcutsHintBriefly(), 500);
    }
  }

  ngOnDestroy() {
    this.cleanupKeyboardShortcuts();
    this.hideShortcutsHint();
  }

  // ============================================================================
  // Métodos Públicos
  // ============================================================================

  /**
   * Manejar clic de acción rápida
   */
  onQuickAction(actionId: string) {
    if (this.executingAction() === actionId) return;

    this.quickActionTriggered.emit({
      actionId,
      selectedCount: this.selectedCount(),
    });
  }

  /**
   * Manejar clic de acción avanzada
   */
  onAdvancedAction(actionId: string) {
    if (this.executingAction() === actionId) return;

    this.advancedActionTriggered.emit({
      actionId,
      selectedCount: this.selectedCount(),
    });
  }

  /**
   * Manejar solicitud de exportación
   */
  onExport(format: string) {
    this.exportRequested.emit({
      format,
      selectedCount: this.selectedCount(),
    });
  }

  /**
   * Alternar panel de acciones avanzadas
   */
  toggleAdvanced() {
    const newState = !this._showAdvanced();
    this._showAdvanced.set(newState);
    this.advancedToggled.emit(newState);
  }

  /**
   * Limpiar selección
   */
  onClearSelection() {
    this.clearSelection.emit();
    this._showAdvanced.set(false);
  }

  /**
   * Obtener variante del botón de acción
   */
  getActionVariant(
    action: BulkAction
  ):
    | 'primary'
    | 'secondary'
    | 'danger'
    | 'ghost'
    | 'success'
    | 'warning'
    | 'info'
    | 'outline-primary'
    | 'outline-secondary' {
    if (this.executingAction() === action.id) {
      return 'ghost';
    }

    // Mapear variantes de BulkAction a variantes de Button
    switch (action.variant) {
      case 'primary':
        return 'primary';
      case 'secondary':
        return 'secondary';
      case 'danger':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'success':
        return 'success';
      case 'ghost':
        return 'ghost';
      default:
        return 'ghost';
    }
  }

  /**
   * Verificar si la acción se está ejecutando
   */
  isActionExecuting(actionId: string): boolean {
    return this.executingAction() === actionId;
  }

  /**
   * Mostrar pista de atajos por un período breve
   */
  showShortcutsHintBriefly() {
    if (!this.enableHotkeys()) return;

    // Limpiar cualquier temporizador existente
    if (this._shortcutsHintTimer) {
      clearTimeout(this._shortcutsHintTimer);
    }

    // Mostrar pista
    this._showShortcutsHint.set(true);

    // Ocultar automáticamente después de 4 segundos
    this._shortcutsHintTimer = setTimeout(() => {
      this._showShortcutsHint.set(false);
      this._shortcutsHintTimer = null;
    }, 4000);
  }

  /**
   * Ocultar pista de atajos inmediatamente
   */
  hideShortcutsHint() {
    if (this._shortcutsHintTimer) {
      clearTimeout(this._shortcutsHintTimer);
      this._shortcutsHintTimer = null;
    }
    this._showShortcutsHint.set(false);
  }

  // ============================================================================
  // Métodos Privados
  // ============================================================================

  /**
   * Configurar atajos de teclado
   */
  private setupKeyboardShortcuts() {
    if (!this.enableHotkeys()) return;

    const shortcuts = [
      { key: 'Escape', action: () => this.onClearSelection() },
      { key: 'e', action: () => this.toggleAdvanced() },
      { key: 'x', action: () => this.onClearSelection() },
    ];

    shortcuts.forEach((shortcut) => {
      const listener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
        if (
          this.isVisible() &&
          event.key === shortcut.key &&
          !event.ctrlKey &&
          !event.altKey &&
          !event.metaKey
        ) {
          // Solo activar si no está en un campo de entrada
          const target = event.target as HTMLElement;
          if (
            target.tagName !== 'INPUT' &&
            target.tagName !== 'TEXTAREA' &&
            !target.isContentEditable
          ) {
            event.preventDefault();
            shortcut.action();
          }
        }
      });
      this._keyboardListeners.push(listener);
    });

    // Agregar atajos de teclas numéricas para acciones rápidas
    this.availableQuickActions().forEach((action) => {
      if (action.hotkey) {
        const listener = this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
          if (
            this.isVisible() &&
            event.key === action.hotkey &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey
          ) {
            const target = event.target as HTMLElement;
            if (
              target.tagName !== 'INPUT' &&
              target.tagName !== 'TEXTAREA' &&
              !target.isContentEditable
            ) {
              event.preventDefault();
              this.onQuickAction(action.id);
            }
          }
        });
        this._keyboardListeners.push(listener);
      }
    });
  }

  /**
   * Limpiar atajos de teclado
   */
  private cleanupKeyboardShortcuts() {
    this._keyboardListeners.forEach((cleanup) => cleanup());
    this._keyboardListeners = [];
  }

  /**
   * Posicionar barra de herramientas en el centro inferior de la pantalla con ancho responsivo
   */
  private positionToolbar() {
    const element = this.elementRef.nativeElement;
    this.renderer.setStyle(element, 'position', 'fixed');
    this.renderer.setStyle(element, 'bottom', '20px');
    this.renderer.setStyle(element, 'left', '50%');
    this.renderer.setStyle(element, 'transform', 'translateX(-50%)');
    this.renderer.setStyle(element, 'z-index', '1000');

    // Remover ancho máximo fijo, dejar que CSS maneje la responsividad
    // El CSS ahora maneja las restricciones de ancho correctamente
  }

  /**
   * Configurar ajustes de layout responsivo basados en el contenido
   */
  private setupResponsiveLayout() {
    // Agregar atributos de datos para estilos CSS basados en el conteo de acciones
    const updateAttributes = () => {
      const quickActionsCount = this.availableQuickActions().length;
      const totalActionsCount = quickActionsCount + this.availableAdvancedActions().length;

      const element = this.elementRef.nativeElement;
      this.renderer.setAttribute(element, 'data-quick-actions', quickActionsCount.toString());
      this.renderer.setAttribute(element, 'data-total-actions', totalActionsCount.toString());

      // Agregar clase responsiva basada en el conteo de acciones
      if (quickActionsCount > 4) {
        this.renderer.addClass(element, 'many-actions');
      } else {
        this.renderer.removeClass(element, 'many-actions');
      }
    };

    // Update attributes initially and when actions change
    updateAttributes();

    // Watch for changes in action counts (simplified approach)
    // In a real implementation, you might want to use effects for this
    setTimeout(updateAttributes, 100);
  }
}
