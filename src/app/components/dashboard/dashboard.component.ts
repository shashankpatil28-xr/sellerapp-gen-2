import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class Dashboard {
  // Dashboard component logic can be added here
  constructor() {
    console.log('Dashboard component initialized');
  }
}
