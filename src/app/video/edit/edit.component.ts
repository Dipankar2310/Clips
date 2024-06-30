import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { ModalService } from '../../services/modal.service';
import IClip from '../../model/clip.model';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ClipService } from '../../services/clip.service';
@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrl: './edit.component.css',
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {
  constructor(private modal: ModalService, private clipsService: ClipService) {}

  @Input()
  activeClip: IClip | null = null;
  inSubmission = false;
  showAlert = false;
  alertColor = 'blue';
  alertMsg = 'Please wait! Updating Clip.';
  @Output() update = new EventEmitter();
  ngOnInit() {
    this.modal.register('editClip');
  }
  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (!this.activeClip) return;

    this.showAlert = false;
    this.inSubmission = false;
    this.editForm.controls.clipId.setValue(this.activeClip?.docId as string);
    this.editForm.controls.title.setValue(this.activeClip.title);
  }

  editForm = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
    clipId: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
  });

  async submit() {
    if (!this.activeClip) return;
    this.alertColor = 'blue';
    this.alertMsg = 'Please wait! Updating Clip.';
    this.inSubmission = true;
    this.showAlert = true;
    try {
      await this.clipsService.updateClip(
        this.editForm.controls.clipId.value,
        this.editForm.controls.title.value
      );
    } catch (e) {
      this.inSubmission = false;
      this.alertColor = 'red';
      this.alertMsg = 'Something went wrong! Try again later.';
    }
    this.activeClip.title = this.editForm.controls.title.value;
    this.update.emit(this.activeClip);
    this.inSubmission = false;
    this.alertColor = 'green';
    this.alertMsg = 'Success! Clip has been updated.';
    setTimeout(() => {
      this.showAlert = false;
      this.modal.toggleModal('editClip');
    }, 1000);
  }
}
