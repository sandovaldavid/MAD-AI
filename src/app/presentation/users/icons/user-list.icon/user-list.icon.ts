import { Component, Input } from '@angular/core';

@Component({
  selector: 'icon-user-list',
  imports: [],
  templateUrl: './user-list.icon.html',
  styleUrl: './user-list.icon.css'
})
export class UserListIcon {
  @Input() size: string = '24'; // Default size in pixels or any CSS unit
  @Input() customClass: string = '';
}
