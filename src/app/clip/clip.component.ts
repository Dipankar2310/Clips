import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import videojs from 'video.js';
import Player from 'video.js/dist/types/player';
import IClip from '../model/clip.model';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-clip',
  templateUrl: './clip.component.html',
  styleUrl: './clip.component.css',
  encapsulation: ViewEncapsulation.None,
  providers:[DatePipe]
})
export class ClipComponent implements OnInit {
  @ViewChild('videoPlayer', { static: true }) target?: ElementRef;

  player?: Player;
  clip?:IClip
  constructor(public route: ActivatedRoute) {}

  ngOnInit(): void {
    this.player = videojs(this.target?.nativeElement);
    //we have to do this because angular does not destroy the route component if we are
    //routing to the same component so this component will not be destroyed and even
    // after redirecting id will be same as before of the previous clip
    this.route.data.subscribe((data) => {
      this.clip=data['clip'] as IClip

      this.player?.src({src:this.clip.url, type:'video/mp4'})
    });
  }
}
