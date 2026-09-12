import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the spending tracker header and empty state', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain('Spendings');
    expect(compiled.textContent).toContain('No spendings recorded yet.');
  });

  it('should open the quick add modal from the action button', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    const button = compiled.querySelector('[data-testid="quick-add-button"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(compiled.textContent).toContain('Quick Add');
    expect(compiled.querySelector('form')).not.toBeNull();
  });
});
