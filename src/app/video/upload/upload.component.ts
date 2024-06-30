import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  AngularFireStorage,
  AngularFireUploadTask,
} from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { last, switchMap } from 'rxjs';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';
import { ClipService } from '../../services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from '../../services/ffmpeg.service';
import { combineLatest, forkJoin } from 'rxjs';
@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css',
})
export class UploadComponent implements OnDestroy {
  isDragover = false;
  file: File | null = null;
  nextStep = false;
  showAlert = false;
  alertColor = 'blue';
  alertMsg = 'Please wait! Your clip is being uploaded.';
  inSubmission = false;
  percentage = 0;
  showPercentage = false;
  user: firebase.User | null = null;
  task?: AngularFireUploadTask;
  sstask?: AngularFireUploadTask;
  screenshots: string[] = [];
  selectedThumbnail: string = '';

  constructor(
    private storage: AngularFireStorage,
    private auth: AngularFireAuth,
    private clipsService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe((user) => (this.user = user));
    this.ffmpegService.init();
  }

  uploadForm = new FormGroup({
    title: new FormControl('', {
      validators: [Validators.required, Validators.minLength(3)],
      nonNullable: true,
    }),
  });

  ngOnDestroy(): void {
    this.task?.cancel();
  }

  async storeFile(event: Event) {
    if (this.ffmpegService.isRunning) return;
    this.isDragover = false;
    this.file = (event as DragEvent).dataTransfer
      ? (event as DragEvent).dataTransfer?.files.item(0) ?? null
      : (event.target as HTMLInputElement).files?.item(0) ?? null;

    if (!this.file || this.file.type !== 'video/mp4') return;

    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedThumbnail = this.screenshots[0];

    this.uploadForm.controls.title.setValue(
      this.file.name.replace(/\.[^/.]+$/, '')
    );
    this.nextStep = true;
  }

  async uploadFile() {
    this.uploadForm.disable();
    this.showAlert = true;
    this.alertColor = 'blue';
    this.alertMsg = 'Please wait! Your clip is being uploaded.';
    this.inSubmission = true;
    this.showPercentage = true;
    const clipFileName = uuid();
    const clipPath = `clips/${clipFileName}.mp4`;
    const ssBlob = await this.ffmpegService.blobFromUrl(this.selectedThumbnail);
    const ssPath = `screenshots/${clipFileName}.png`;
    this.task = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);
    this.sstask = this.storage.upload(ssPath, ssBlob);
    const ssRef = this.storage.ref(ssPath);
    combineLatest([
      this.task.percentageChanges(),
      this.sstask.percentageChanges(),
    ]).subscribe((progress) => {
      const [clipProg, ssProg] = progress;
      if (!clipProg || !ssProg) return;
      const totalProg = clipProg + ssProg;
      this.percentage = (totalProg as number) / 200;
    });

    forkJoin([this.task.snapshotChanges(), this.sstask.snapshotChanges()])
      .pipe(
        switchMap(() =>
          forkJoin([clipRef.getDownloadURL(), ssRef.getDownloadURL()])
        )
      )
      .subscribe({
        next: async (urls) => {
          const [clipUrl, ssUrl] = urls;
          const clip = {
            uid: this.user?.uid as string,
            title: this.uploadForm.controls.title.value,
            displayName: this.user?.displayName as string,
            fileName: `${clipFileName}.mp4`,
            url: clipUrl,
            ssUrl,
            ssFileName: `${clipFileName}.png`,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          };
          const clipDocRef = await this.clipsService.createClip(clip);
          this.alertColor = 'green';
          this.alertMsg = 'Upload Successful!';
          this.showPercentage = false;

          setTimeout(() => {
            this.router.navigate(['clip', clipDocRef.id]);
          }, 1000);
        },
        error: (error) => {
          this.uploadForm.enable();
          this.alertColor = 'red';
          this.alertMsg = 'Upload failed! Please try again later.';
          this.inSubmission = true;
          this.showPercentage = false;
          console.log(error);
        },
      });
  }
}
