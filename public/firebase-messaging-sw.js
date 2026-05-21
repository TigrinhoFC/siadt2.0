// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:"AIzaSyA32cijdZtQkiBtUgDdIDHiFzUd2UEGKog",
  authDomain:"projetofinal-siadt.firebaseapp.com",
  projectId: "projetofinal-siadt",
  storageBucket:  "projetofinal-siadt.firebasestorage.app",
  messagingSenderId:"912739144536",
  appId:  "1:912739144536:web:fc96e1e791cdd5892dcb2d"
});

const messaging = firebase.messaging();

// Lógica para quando o app está em segundo plano
messaging.onBackgroundMessage((payload) => {
  console.log('Mensagem recebida em segundo plano: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-siadt.png', // Caminho para sua logo na pasta public
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});