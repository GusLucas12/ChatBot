import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddCard } from './add-card';

describe('AddCard', () => {
  let component: AddCard;
  let fixture: ComponentFixture<AddCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
