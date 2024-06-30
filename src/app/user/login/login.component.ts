import { Component } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private auth: AngularFireAuth) {}
  credentials = { email: '', password: '' };
  inSubmission = false;
  showAlert = false;
  alertMsg = 'Please wait! Logging In.';
  alertColor = 'blue';

  async login() {
    this.inSubmission = true;
    this.showAlert = true;
    try {
      await this.auth.signInWithEmailAndPassword(
        this.credentials.email,
        this.credentials.password
      );
    } catch (e) {
      this.inSubmission = false;
      this.alertMsg =
        'Oops! Something went wrong, please verify the credentials and try again.';
      this.alertColor = 'red';
      return;
    }
    this.inSubmission = false;
    this.alertMsg = 'Log in successfull!';
    this.alertColor = 'green';
  }
}
