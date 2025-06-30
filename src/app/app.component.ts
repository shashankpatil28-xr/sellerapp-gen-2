// src/app/app.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// import { SidebarComponent } from './components/sidebar/sidebar.component'; // REMOVE THIS IMPORT

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],    
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'test-sellerapp';
}