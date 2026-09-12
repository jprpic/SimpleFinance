import { Component } from '@angular/core';

@Component({
  selector: 'app-savings-page',
  standalone: true,
  template: `
    <section class="page-shell">
      <p class="eyebrow">Planning</p>
      <h2>Savings</h2>
      <p class="empty-state">Savings tracking is coming soon.</p>
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

      .eyebrow {
        margin: 0 0 6px;
        color: #6b7280;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      h2 {
        margin: 0 0 16px;
        font-size: clamp(2rem, 5vw, 2.75rem);
      }

      .empty-state {
        margin: 0;
        color: #6b7280;
      }
    `,
  ],
})
export class SavingsPageComponent {}