import { Injectable } from '@angular/core';
import {
  AngularFirestore,
  AngularFirestoreCollection,
  DocumentReference,
  QuerySnapshot,
} from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import IClip from '../model/clip.model';
import {
  switchMap,
  of,
  map,
  BehaviorSubject,
  combineLatest,
  timestamp,
  lastValueFrom,
  Observable,
} from 'rxjs';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot,Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ClipService implements Resolve<IClip|null> {
  public clipsCollection: AngularFirestoreCollection<IClip>;
  pageClips: IClip[] = [];
  pendingRequest = false;
  constructor(
    private db: AngularFirestore,
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private router:Router
  ) {
    this.clipsCollection = db.collection('clips');
  }


  createClip(data: IClip): Promise<DocumentReference<IClip>> {
    return this.clipsCollection.add(data);
  }
  getUserClips(sort$: BehaviorSubject<string>) {
    return combineLatest([this.auth.user, sort$]).pipe(
      switchMap((values) => {
        const [user, sort] = values;
        if (!user) return of([]);
        const query = this.clipsCollection.ref
          .where('uid', '==', user.uid)
          .orderBy('timestamp', sort === '1' ? 'desc' : 'asc');
        return query.get();
      }),
      map((snapshot) => (snapshot as QuerySnapshot<IClip>).docs)
    );
  }
  updateClip(id: string, title: string) {
    this.clipsCollection.doc(id).update({ title });
  }

  async deleteClip(clip: IClip) {
    const clipRef = this.storage.ref(`clips/${clip.fileName}`);
    const ssRef = this.storage.ref(`screenshots/${clip.ssFileName}`);
    await clipRef.delete();
    await ssRef.delete();
    await this.clipsCollection.doc(clip.docId).delete();
  }

  async getCLips() {
    if (this.pendingRequest) return;
    this.pendingRequest = true;
    let query = this.clipsCollection.ref.orderBy('timestamp', 'desc').limit(6);
    const { length } = this.pageClips;
    if (length) {
      const lastDocId = this.pageClips[length - 1].docId;
      const lastDoc =await lastValueFrom(this.clipsCollection.doc(lastDocId).get());

      query = query.startAfter(lastDoc);
    }
    const snapshot = await query.get();

    snapshot.forEach((doc) => {
      this.pageClips.push({
        docId: doc.id,
        ...doc.data(),
      });
    });

    this.pendingRequest = false;
  }
  resolve(route:ActivatedRouteSnapshot,state:RouterStateSnapshot){
return this.clipsCollection.doc(route.params['id']).get().pipe(
  map(snapshot=>{
    const data=snapshot.data()
    if(!data){
      this.router.navigate(['/'])
      return null;
    }
    return data
  })
)
  }
}
