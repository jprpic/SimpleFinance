import { Component, inject, OnInit, signal } from '@angular/core';

import { Category, Spending } from '../../models/spending.model';
import { StorageService } from '../../services/storage.service';
import { QuickAddFormValue, QuickAddModalComponent } from '../quick-add-modal/quick-add-modal';
import { SpendingListComponent } from '../spending-list/spending-list';

@Component({
  selector: 'app-spending-page',
  standalone: true,
  imports: [QuickAddModalComponent, SpendingListComponent],
  template: `
    <section class="page-shell">
      <div class="page-header">
        <div>
          <p class="eyebrow">Administration</p>
          <h2>Spendings</h2>
        </div>

        <button
          type="button"
          class="quick-add-button"
          data-testid="quick-add-button"
          (click)="openModal()"
        >
          Quick Add +
        </button>
      </div>

      <app-spending-list [spendings]="spendings()" (editRequested)="openEditModal($event)" (deleteRequested)="deleteSpending($event)"></app-spending-list>
      <app-quick-add-modal
        [isOpen]="isModalOpen()"
        [spendingToEdit]="spendingToEdit()"
        (closed)="closeModal()"
        (submitted)="handleQuickAddSubmit($event)"
      ></app-quick-add-modal>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-shell {
        max-width: 900px;
        margin: 0 auto;
        padding: 0 20px 40px;
      }

      .page-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0 0 6px;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b7280;
      }

      h2 {
        margin: 0;
        font-size: clamp(2rem, 5vw, 2.75rem);
      }

      .quick-add-button {
        border: none;
        border-radius: 12px;
        background: #111827;
        color: #fff;
        padding: 0.8rem 1.2rem;
        font-weight: 700;
        cursor: pointer;
        transition: transform 0.15s ease;
      }

      .quick-add-button:hover {
        transform: translateY(-1px);
      }
    `,
  ],
})
export class SpendingPageComponent implements OnInit {
  private readonly storage = inject(StorageService);

  protected readonly spendings = signal<Spending[]>([]);
  protected readonly isModalOpen = signal(false);
  protected readonly spendingToEdit = signal<Spending | null>(null);

  async ngOnInit(): Promise<void> {
    await this.loadSpendings();
  }

  protected async loadSpendings(): Promise<void> {
    this.spendings.set(await this.storage.getSpendings());
  }

  protected openModal(): void {
    this.spendingToEdit.set(null);
    this.isModalOpen.set(true);
  }

  protected closeModal(): void {
    this.isModalOpen.set(false);
    this.spendingToEdit.set(null);
  }

  protected openEditModal(spending: Spending): void {
    this.spendingToEdit.set(spending);
    this.isModalOpen.set(true);
  }

  protected async handleQuickAddSubmit(formValue: QuickAddFormValue): Promise<void> {
    const changes = {
      amount: Number(formValue.amount),
      category: formValue.category ?? Category.HOUSING,
      subcategory: formValue.subcategory,
    };
    const nextSpendings = formValue.id
      ? await this.storage.updateSpending(formValue.id, changes)
      : await this.storage.addSpending(changes);

    this.spendings.set(nextSpendings);
    this.closeModal();
  }

  protected async deleteSpending(id: string): Promise<void> {
    const nextSpendings = await this.storage.deleteSpending(id);
    this.spendings.set(nextSpendings);
  }
}
