// استيراد الوحدات من Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update, get } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-storage.js";

// تكوين Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCJ4VhGD49H3RNifMf9VCRPnkALAxNpsOU",
  authDomain: "project-2980864980936907935.firebaseapp.com",
  databaseURL: "https://project-2980864980936907935-default-rtdb.firebaseio.com",
  projectId: "project-2980864980936907935",
  storageBucket: "project-2980864980936907935.appspot.com",
  messagingSenderId: "580110751353",
  appId: "1:580110751353:web:8f039f9b34e1709d4126a8",
  measurementId: "G-R3JNPHCFZG"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app);

// متغيرات التطبيق
let currentUser = null;
let currentUserType = null;

// عناصر DOM
const elements = {
    // الشاشات
    roleSelection: document.getElementById('roleSelection'),
    clientLogin: document.getElementById('clientLogin'),
    barberLogin: document.getElementById('barberLogin'),
    clientDashboard: document.getElementById('clientDashboard'),
    barberDashboard: document.getElementById('barberDashboard'),
    
    // الأزرار الرئيسية
    clientBtn: document.getElementById('clientBtn'),
    barberBtn: document.getElementById('barberBtn'),
    
    // عناصر تسجيل الدخول
    clientLoginBtn: document.getElementById('clientLoginBtn'),
    barberLoginBtn: document.getElementById('barberLoginBtn'),
    barberSignupBtn: document.getElementById('barberSignupBtn'),
    
    // أزرار التنقل
    clientBackBtn: document.getElementById('clientBackBtn'),
    barberBackBtn: document.getElementById('barberBackBtn'),
    showSignupBtn: document.getElementById('showSignupBtn'),
    showLoginBtn: document.getElementById('showLoginBtn'),
    
    // أزرار الخروج
    clientLogoutBtn: document.getElementById('clientLogoutBtn'),
    barberLogoutBtn: document.getElementById('barberLogoutBtn'),
    
    // حقول الإدخال
    clientName: document.getElementById('clientName'),
    clientPhone: document.getElementById('clientPhone'),
    barberPhone: document.getElementById('barberPhone'),
    barberPassword: document.getElementById('barberPassword'),
    barberName: document.getElementById('barberName'),
    newBarberPhone: document.getElementById('newBarberPhone'),
    newBarberPassword: document.getElementById('newBarberPassword'),
    confirmBarberPassword: document.getElementById('confirmBarberPassword'),
    barberImage: document.getElementById('barberImage'),
    salonLink: document.getElementById('salonLink'),
    
    // عناصر أخرى
    barberFormTitle: document.getElementById('barberFormTitle'),
    barberLoginForm: document.getElementById('barberLoginForm'),
    barberSignupForm: document.getElementById('barberSignupForm'),
    clientError: document.getElementById('clientError'),
    barberError: document.getElementById('barberError'),
    clientAvatar: document.getElementById('clientAvatar'),
    barberAvatar: document.getElementById('barberAvatar'),
    statusToggle: document.getElementById('statusToggle'),
    statusText: document.getElementById('statusText'),
    barberQueue: document.getElementById('barberQueue'),
    barbersList: document.getElementById('barbersList'),
    currentBookingContainer: document.getElementById('currentBookingContainer'),
    bookingBarber: document.getElementById('bookingBarber'),
    bookingPosition: document.getElementById('bookingPosition'),
    bookingTime: document.getElementById('bookingTime'),
    cancelBookingBtn: document.getElementById('cancelBookingBtn')
};

// ============= إعداد Event Listeners =============
elements.clientBtn.addEventListener('click', () => showScreen('clientLogin'));
elements.barberBtn.addEventListener('click', () => showScreen('barberLogin'));
elements.clientLoginBtn.addEventListener('click', clientLogin);
elements.barberLoginBtn.addEventListener('click', barberLogin);
elements.barberSignupBtn.addEventListener('click', barberSignup);
elements.clientBackBtn.addEventListener('click', () => showScreen('roleSelection'));
elements.barberBackBtn.addEventListener('click', () => showScreen('roleSelection'));
elements.showSignupBtn.addEventListener('click', showBarberSignup);
elements.showLoginBtn.addEventListener('click', showBarberLogin);
elements.clientLogoutBtn.addEventListener('click', logout);
elements.barberLogoutBtn.addEventListener('click', logout);
elements.cancelBookingBtn.addEventListener('click', () => {
    if (currentUser?.booking) {
        cancelBooking(currentUser.booking.barberId, currentUser.booking.bookingId);
    }
});

// ============= وظائف العرض والإخفاء =============
function showScreen(screenId) {
    document.querySelectorAll('.container, .dashboard').forEach(el => {
        el.classList.add('hidden');
    });
    document.getElementById(screenId).classList.remove('hidden');
}

function showBarberSignup() {
    elements.barberFormTitle.textContent = 'إنشاء حساب حلاق جديد';
    elements.barberLoginForm.classList.add('hidden');
    elements.barberSignupForm.classList.remove('hidden');
}

function showBarberLogin() {
    elements.barberFormTitle.textContent = 'تسجيل الدخول للحلاقين';
    elements.barberSignupForm.classList.add('hidden');
    elements.barberLoginForm.classList.remove('hidden');
}

// ============= وظائف إدارة الحسابات =============
async function clientLogin() {
    const name = elements.clientName.value.trim();
    const phone = elements.clientPhone.value.trim();
    
    if (!name) {
        showError(elements.clientError, 'الرجاء إدخال الاسم');
        return;
    }
    
    if (!phone || !/^[0-9]{10,15}$/.test(phone)) {
        showError(elements.clientError, 'الرجاء إدخال رقم هاتف صحيح');
        return;
    }
    
    currentUser = {
        id: generateId(),
        name: name,
        phone: phone,
        type: 'client'
    };
    currentUserType = 'client';
    
    elements.clientAvatar.textContent = name.charAt(0);
    showScreen('clientDashboard');
    await loadBarbers();
}

async function barberLogin() {
    const phone = elements.barberPhone.value.trim();
    const password = elements.barberPassword.value;
    
    if (!phone || !password) {
        showError(elements.barberError, 'رقم الهاتف وكلمة المرور مطلوبان');
        return;
    }
    
    try {
        const userCredential = await signInWithEmailAndPassword(auth, `${phone}@barber.com`, password);
        const user = userCredential.user;
        
        const barberRef = ref(database, 'barbers/' + user.uid);
        const snapshot = await get(barberRef);
        
        if (snapshot.exists()) {
            const barberData = snapshot.val();
            
            currentUser = {
                id: user.uid,
                name: barberData.name,
                phone: barberData.phone,
                type: 'barber',
                imageUrl: barberData.imageUrl || '',
                salonLink: barberData.salonLink || ''
            };
            
            elements.barberAvatar.textContent = barberData.name.charAt(0);
            showScreen('barberDashboard');
            loadBarberQueue();
        } else {
            showError(elements.barberError, 'بيانات الحلاق غير موجودة');
            await signOut(auth);
        }
    } catch (error) {
        handleAuthError(error, elements.barberError);
    }
}

async function barberSignup() {
    const name = elements.barberName.value.trim();
    const phone = elements.newBarberPhone.value.trim();
    const password = elements.newBarberPassword.value;
    const confirmPassword = elements.confirmBarberPassword.value;
    const salonLink = elements.salonLink.value.trim();
    const imageFile = elements.barberImage.files[0];
    
    // التحقق من صحة البيانات
    if (!name || !phone || !password || !confirmPassword) {
        showError(elements.barberError, 'جميع الحقول مطلوبة');
        return;
    }
    
    if (!/^[0-9]{10,15}$/.test(phone)) {
        showError(elements.barberError, 'رقم الهاتف يجب أن يكون بين 10-15 رقمًا');
        return;
    }
    
    if (password.length < 6) {
        showError(elements.barberError, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        return;
    }
    
    if (password !== confirmPassword) {
        showError(elements.barberError, 'كلمتا المرور غير متطابقتين');
        return;
    }
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, `${phone}@barber.com`, password);
        const user = userCredential.user;
        
        let imageUrl = '';
        if (imageFile) {
            const fileRef = storageRef(storage, `barber_images/${user.uid}`);
            await uploadBytes(fileRef, imageFile);
            imageUrl = await getDownloadURL(fileRef);
        }
        
        const barberData = {
            name: name,
            phone: phone,
            status: 'open',
            queue: {},
            salonLink: salonLink || '',
            imageUrl: imageUrl || ''
        };
        
        await set(ref(database, 'barbers/' + user.uid), barberData);
        
        currentUser = {
            id: user.uid,
            name: name,
            phone: phone,
            type: 'barber',
            imageUrl: imageUrl,
            salonLink: salonLink
        };
        
        elements.barberAvatar.textContent = name.charAt(0);
        showScreen('barberDashboard');
        loadBarberQueue();
    } catch (error) {
        handleAuthError(error, elements.barberError);
    }
}

// ============= وظائف مساعدة =============
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
    setTimeout(() => element.classList.add('hidden'), 5000);
}

function handleAuthError(error, errorElement) {
    let errorMessage = 'حدث خطأ أثناء المصادقة';
    switch(error.code) {
        case 'auth/email-already-in-use':
            errorMessage = 'هذا الرقم مسجل بالفعل';
            break;
        case 'auth/invalid-email':
            errorMessage = 'بريد إلكتروني غير صالح';
            break;
        case 'auth/weak-password':
            errorMessage = 'كلمة المرور ضعيفة جداً';
            break;
        case 'auth/user-not-found':
            errorMessage = 'الحساب غير موجود';
            break;
        case 'auth/wrong-password':
            errorMessage = 'كلمة المرور غير صحيحة';
            break;
    }
    showError(errorElement, errorMessage);
}

function generateId() {
    return 'id-' + Math.random().toString(36).substr(2, 9);
}

// ============= وظائف إدارة الحجوزات =============
async function loadBarbers() {
    elements.barbersList.innerHTML = 'جارٍ التحميل...';
    
    onValue(ref(database, 'barbers'), (snapshot) => {
        const barbers = snapshot.val() || {};
        elements.barbersList.innerHTML = '';
        
        Object.entries(barbers).forEach(([id, barber]) => {
            const statusClass = barber.status === 'open' ? 'status-open' : 'status-closed';
            const statusText = barber.status === 'open' ? 'مفتوح' : 'مغلق';
            const queueLength = barber.queue ? Object.keys(barber.queue).length : 0;
            
            const barberCard = document.createElement('div');
            barberCard.className = 'barber-card';
            barberCard.innerHTML = `
                <div class="barber-info">
                    <div class="barber-header">
                        ${barber.imageUrl ? 
                            `<img src="${barber.imageUrl}" class="barber-avatar-img" alt="${barber.name}">` : 
                            `<div class="barber-avatar">${barber.name.charAt(0)}</div>`}
                        <div class="barber-name">${barber.name}</div>
                    </div>
                    ${barber.salonLink ? `<a href="${barber.salonLink}" target="_blank" class="salon-link">زيارة الصالون</a>` : ''}
                    <div class="barber-status ${statusClass}">${statusText}</div>
                    <div class="barber-details">
                        <div>رقم الهاتف: ${barber.phone || 'غير متوفر'}</div>
                        <div>عدد المنتظرين: ${queueLength}</div>
                        <div>وقت الانتظار التقريبي: ${queueLength * 15} دقيقة</div>
                    </div>
                </div>
                <button class="book-btn" ${barber.status === 'closed' ? 'disabled' : ''} 
                        data-barber-id="${id}" data-barber-name="${barber.name.replace(/'/g, "\\'")}">
                    ${barber.status === 'open' ? 'احجز الآن' : 'غير متاح'}
                </button>
            `;
            
            elements.barbersList.appendChild(barberCard);
        });

        // إضافة event listeners لأزرار الحجز
        document.querySelectorAll('.book-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const barberId = e.currentTarget.getAttribute('data-barber-id');
                const barberName = e.currentTarget.getAttribute('data-barber-name');
                bookAppointment(barberId, barberName);
            });
        });
    });
}

async function bookAppointment(barberId, barberName) {
    if (!currentUser) return;
    
    try {
        const newBookingRef = push(ref(database, `barbers/${barberId}/queue`));
        await set(newBookingRef, {
            clientId: currentUser.id,
            clientName: currentUser.name,
            clientPhone: currentUser.phone,
            timestamp: Date.now()
        });
        
        currentUser.booking = {
            barberId: barberId,
            barberName: barberName,
            bookingId: newBookingRef.key,
            timestamp: new Date().toLocaleString()
        };
        
        showCurrentBooking();
        alert(`تم الحجز بنجاح مع الحلاق ${barberName}`);
    } catch (error) {
        alert('حدث خطأ أثناء الحجز: ' + error.message);
    }
}

function showCurrentBooking() {
    if (!currentUser?.booking) {
        elements.currentBookingContainer.classList.add('hidden');
        return;
    }
    
    const { barberId, bookingId } = currentUser.booking;
    elements.bookingBarber.textContent = currentUser.booking.barberName;
    elements.bookingTime.textContent = currentUser.booking.timestamp;
    
    onValue(ref(database, `barbers/${barberId}/queue`), (snapshot) => {
        const queue = snapshot.val() || {};
        let position = 0;
        
        Object.keys(queue).forEach((key, index) => {
            if (key === bookingId) position = index + 1;
        });
        
        elements.bookingPosition.textContent = position;
    });
    
    elements.currentBookingContainer.classList.remove('hidden');
}

async function cancelBooking(barberId, bookingId) {
    if (!confirm('هل أنت متأكد من إلغاء الحجز؟')) return;
    
    try {
        await remove(ref(database, `barbers/${barberId}/queue/${bookingId}`));
        delete currentUser.booking;
        elements.currentBookingContainer.classList.add('hidden');
        alert('تم إلغاء الحجز بنجاح');
    } catch (error) {
        alert('حدث خطأ أثناء إلغاء الحجز: ' + error.message);
    }
}

async function loadBarberQueue() {
    if (!currentUser || currentUser.type !== 'barber') return;
    
    onValue(ref(database, `barbers/${currentUser.id}/queue`), (snapshot) => {
        const queue = snapshot.val() || {};
        elements.barberQueue.innerHTML = '';
        
        if (Object.keys(queue).length === 0) {
            elements.barberQueue.innerHTML = '<li>لا يوجد عملاء في قائمة الانتظار</li>';
            return;
        }
        
        Object.entries(queue).forEach(([bookingId, booking], index) => {
            const queueItem = document.createElement('li');
            queueItem.className = 'queue-item';
            queueItem.innerHTML = `
                <div class="queue-info">
                    <div class="queue-position">الرقم ${index + 1}</div>
                    <div class="queue-name">${booking.clientName}</div>
                    <div class="queue-phone">${booking.clientPhone || 'غير متوفر'}</div>
                    <div class="queue-time">${new Date(booking.timestamp).toLocaleString()}</div>
                </div>
                ${index === 0 ? `<button class="delete-btn" data-booking-id="${bookingId}"><i class="fas fa-check"></i></button>` : ''}
            `;
            
            if (index === 0) {
                queueItem.querySelector('.delete-btn').addEventListener('click', () => {
                    completeClient(currentUser.id, bookingId);
                });
            }
            
            elements.barberQueue.appendChild(queueItem);
        });
    });
}

async function completeClient(barberId, bookingId) {
    try {
        await remove(ref(database, `barbers/${barberId}/queue/${bookingId}`));
        alert('تم إنهاء خدمة العميل بنجاح');
    } catch (error) {
        alert('حدث خطأ أثناء إنهاء الخدمة: ' + error.message);
    }
}

async function logout() {
    try {
        await signOut(auth);
        currentUser = null;
        currentUserType = null;
        
        // مسح حقول الإدخال
        elements.clientName.value = '';
        elements.clientPhone.value = '';
        elements.barberPhone.value = '';
        elements.barberPassword.value = '';
        elements.barberName.value = '';
        elements.newBarberPhone.value = '';
        elements.newBarberPassword.value = '';
        elements.confirmBarberPassword.value = '';
        elements.barberImage.value = '';
        elements.salonLink.value = '';
        
        showScreen('roleSelection');
    } catch (error) {
        alert('حدث خطأ أثناء تسجيل الخروج: ' + error.message);
    }
}

// مراقبة حالة المصادقة
onAuthStateChanged(auth, (user) => {
    if (user && currentUserType === 'barber') {
        showScreen('barberDashboard');
        loadBarberQueue();
    }
});

// تهيئة التطبيق
showScreen('roleSelection');
