import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="cancel()">

      <div class="modal-content fade-in-scale" (click)="$event.stopPropagation()">
        
        <div class="modal-header">
          <h3>Novo Passo</h3>
          <button class="btn-close" (click)="cancel()">×</button>
        </div>
        
        <div class="modal-body">
          <p>Digite um nome curto para identificar este passo (ID).</p>
          <p class="modal-hint">Ex: "doacao_roupas", "endereco", "campanha_natal"</p>
          
          <input type="text" 
                 class="form-control" 
                 [(ngModel)]="newIdInput" 
                 (keydown.enter)="confirm()"
                 placeholder="Digite o ID aqui..."
                 autofocus>
          
          <div class="error-msg" *ngIf="errorMsg">
            ⚠️ {{ errorMsg }}
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" (click)="cancel()">Cancelar</button>
          <button class="btn-primary" (click)="confirm()">Criar Passo</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
  
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
    }

    .modal-content {
      background: white; width: 100%; max-width: 450px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      display: flex; flex-direction: column; overflow: hidden;
      animation: scaleIn 0.3s ease-out;
    }

    .modal-header {
      padding: 20px; border-bottom: 1px solid #eee;
      display: flex; justify-content: space-between; align-items: center;
      h3 { margin: 0; color: #DA577C; font-size: 20px; }
      .btn-close { background: none; border: none; font-size: 24px; color: #999; cursor: pointer; }
    }

    .modal-body {
      padding: 25px 20px;
      p { margin: 0 0 10px; color: #555; font-size: 15px; }
      .modal-hint { font-size: 12px; color: #888; margin-bottom: 15px; }
      .error-msg { margin-top: 10px; color: #d63031; background: #ffe6e6; padding: 10px; border-radius: 6px; font-size: 13px; border: 1px solid #ffcccc; }
    }

    .form-control {
      width: 100%; padding: 12px; font-size: 16px;
      border: 1px solid #ced4da; border-radius: 8px; outline: none;
      &:focus { border-color: #DA577C; box-shadow: 0 0 0 3px rgba(218, 87, 124, 0.25); }
    }

    .modal-footer {
      padding: 20px; background: #f8f9fa; border-top: 1px solid #eee;
      display: flex; justify-content: flex-end; gap: 10px;
    }

    .btn-primary { background: #DA577C; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    .btn-secondary { background: #E6DCDC; color: #555; border: 1px solid #dcd6d6; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; }

    @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class AddCardComponent {

  @Input() existingIds: string[] = [];
  

  @Output() confirmAdd = new EventEmitter<string>();
  

  @Output() close = new EventEmitter<void>();

  newIdInput = '';
  errorMsg = '';

  confirm() {
    if (!this.newIdInput.trim()) {
      this.errorMsg = 'O nome não pode ser vazio.';
      return;
    }

    const cleanId = this.newIdInput.toLowerCase().trim().replace(/\s+/g, '_');

 
    if (this.existingIds.includes(cleanId)) {
      this.errorMsg = `O ID "${cleanId}" já existe!`;
      return;
    }


    this.confirmAdd.emit(cleanId);
    this.newIdInput = ''; 
  }

  cancel() {
    this.close.emit();
  }
}