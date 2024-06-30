import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { ClipService } from '../../services/clip.service';
import IClip from '../../model/clip.model';
import { ModalService } from '../../services/modal.service';
import { BehaviorSubject } from 'rxjs';
@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrl: './manage.component.css',
})
export class ManageComponent implements OnInit {
  videoOrder = '1';
  clips: IClip[] = [];
  activeClip: IClip | null = null;
  sort$: BehaviorSubject<string>;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clipsService: ClipService,
    private modal: ModalService
  ) {
    this.sort$ = new BehaviorSubject(this.videoOrder);
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.videoOrder = params['sort'] === '2' ? '2' : '1';
      this.sort$.next(this.videoOrder);
    });
    this.clipsService.getUserClips(this.sort$).subscribe((docs) => {
      this.clips = [];
      docs.forEach((doc) => {
        this.clips.push({ ...doc.data(), docId: doc.id });
      });
    });
  }
  sort(event: Event) {
    const { value } = event.target as HTMLSelectElement;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sort: value },
    });
  }
  openModal(event: Event, clip: IClip) {
    event.preventDefault();
    console.log('aisjdfja');
    this.activeClip = clip;
    this.modal.toggleModal('editClip');
  }

  refreshClipOnUpdate(event: IClip) {
    this.clips.forEach((element, index) => {
      if (element.docId == event.docId) {
        this.clips[index].title = event.title;
      }
    });
  }

  async deleteClip(event: Event, clip: IClip) {
    event.preventDefault();
    try {
      await this.clipsService.deleteClip(clip);
    } catch (e) {
      console.log('Clip could not be deleted due to a server issue');
      return;
    }
    this.clips.forEach((element, index) => {
      if (element.docId == clip.docId) {
        this.clips.splice(index, 1);
      }
    });
  }
  async copyToClipboard(event: MouseEvent,docId:string|undefined){
    event.preventDefault()
    if(!docId)return
    const url = `${location.origin}/clip/${docId}`
    await navigator.clipboard.writeText(url)
    alert('Link Copied!')
  }
}
