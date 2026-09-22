import {AUTH_PROVIDERS, signInWithProvider, providerErrorMessage, cancelProviderSignIn} from '../services/authProviderService.js';
import {setFormMessage} from './formHelpers.js';

export function googleSignInButton() {
 if (!AUTH_PROVIDERS.google.enabled) return '';
 return `<div class="auth-provider"><button class="google-sign-in" type="button" data-google-sign-in>
 <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6C44.4 38.02 46.98 31.84 46.98 24.55z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.92 2.3-8.18 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
 <span>Continuar com Google</span></button><p class="auth-divider"><span>ou use seu e-mail</span></p></div>`;
}
export function bindGoogleSignIn(root, {feedback, form, destination} = {}) {
 const button = root.querySelector('[data-google-sign-in]');
 if (!button) return () => {};
 let pending = false, disposed = false;
 const guard = event => {
  if (pending) { event.preventDefault(); event.stopImmediatePropagation(); }
  else cancelProviderSignIn();
 };
 const click = async () => {
  if (pending || form?.querySelector('[type="submit"]')?.disabled) return;
  pending = true;
  const submit = form?.querySelector('[type="submit"]');
  button.disabled = true; button.setAttribute('aria-busy','true');
  if (submit) submit.disabled = true;
  setFormMessage(feedback,'Abrindo Google…','success');
  try {
   await signInWithProvider('google',{destination});
   if (!disposed) setFormMessage(feedback,'Conclua o login no navegador. Se voltou sem concluir, toque em Google para tentar novamente.','success');
  } catch(error) { if (!disposed) setFormMessage(feedback,providerErrorMessage(error)); }
  finally {
   pending = false;
   if (!disposed) { button.disabled=false; button.removeAttribute('aria-busy'); if(submit)submit.disabled=false; }
  }
 };
 button.addEventListener('click',click);form?.addEventListener('submit',guard,true);
 return () => {disposed=true;button.removeEventListener('click',click);form?.removeEventListener('submit',guard,true);};
}
