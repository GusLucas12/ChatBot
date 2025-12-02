import { Injectable, Inject, PLATFORM_ID } from '@angular/core'; // Importe PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Importe isPlatformBrowser
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'https://script.google.com/macros/s/AKfycbzPFxF5AWL7hhaMx9_6SuVTqVs0UvyiomGbM9HwSPAcLJJSW02XN3TJ1eLZtagMUPwn/exec';
  
  private _isLoggedIn = false;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object // Injete o ID da plataforma
  ) {
    // BLINDAGEM: Só acessa sessionStorage se for navegador
    if (isPlatformBrowser(this.platformId)) {
      const savedSession = sessionStorage.getItem('ong_auth');
      this._isLoggedIn = savedSession === 'true';
      console.log('🔐 [AuthService] Inicializado no Browser. Logado?', this._isLoggedIn);
    }
  }

  get isLoggedIn() {
    return this._isLoggedIn;
  }

  login(password: string): Observable<boolean> {
    console.log('🔐 [AuthService] Tentando logar...');
    
    return this.http.get<any>(`${this.apiUrl}?action=login&password=${password}`).pipe(
      tap(res => console.log('🔐 [AuthService] Resposta:', res)),
      map(response => {
        if (response && response.valid) {
          this._isLoggedIn = true;
          
          // BLINDAGEM: Só salva se for navegador
          if (isPlatformBrowser(this.platformId)) {
            sessionStorage.setItem('ong_auth', 'true');
          }
          
          return true;
        }
        return false;
      }),
      catchError(err => {
        console.error('🔥 [AuthService] Erro:', err);
        return of(false);
      })
    );
  }

  logout() {
    this._isLoggedIn = false;
    // BLINDAGEM: Só remove se for navegador
    if (isPlatformBrowser(this.platformId)) {
      sessionStorage.removeItem('ong_auth');
    }
  }
}