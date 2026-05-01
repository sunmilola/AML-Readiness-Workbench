import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, collection, query, where, orderBy, getDocs, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js';
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export function isAdminRole(role){return ['System Administrator','Tenant Administrator','Technology Admin'].includes(role)}
export function isSystemAdmin(role){return role==='System Administrator'}
export function showNotice(message,type='success'){const el=document.getElementById('notice'); if(el){el.textContent=message; el.className='notice show '+(type==='error'?'error':'')}}
export function escapeHtml(v){return String(v||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;')}
export function firebaseConfigLooksValid(){return firebaseConfig && firebaseConfig.apiKey && !String(firebaseConfig.apiKey).includes('REPLACE_WITH') && firebaseConfig.projectId && !String(firebaseConfig.projectId).includes('REPLACE_WITH')}
export function explainFirebaseError(err){const code=err?.code||''; if(['auth/invalid-credential','auth/wrong-password','auth/user-not-found'].includes(code)) return 'Invalid email or password.'; if(code==='permission-denied') return 'Permission denied. Check Firestore rules and user profile.'; if(code==='unavailable') return 'Firestore is unavailable or the client is offline.'; return err?.message||'Firebase request failed.'}
export async function getUserProfile(uid){const snap=await getDoc(doc(db,'users',uid)); return snap.exists()?{uid,...snap.data()}:null}
export async function requireAuth(options={}){return new Promise(resolve=>{onAuthStateChanged(auth,async user=>{if(!user){location.href='login.html';return} let profile; try{profile=await getUserProfile(user.uid)}catch(err){console.error(err); location.href='login.html?profile_error=firestore'; return} if(!profile||profile.status!=='Active'){await signOut(auth); location.href='login.html?profile_error=missing'; return} profile={...profile,uid:user.uid}; if(options.adminOnly&&!isAdminRole(profile.role)){location.href='workbench.html';return} resolve({user,profile})})})}
export async function login(email,password){return signInWithEmailAndPassword(auth,email,password)}
export async function resetPassword(email){return sendPasswordResetEmail(auth,email)}
export async function logout(){await signOut(auth); location.href='login.html'}
export async function listTenants(profile){const qRef=isSystemAdmin(profile.role)?query(collection(db,'tenants'),orderBy('name')):query(collection(db,'tenants'),where('__name__','==',profile.tenantId)); const snaps=await getDocs(qRef); return snaps.docs.map(d=>({id:d.id,...d.data()}))}
export async function listUsers(profile){const qRef=isSystemAdmin(profile.role)?query(collection(db,'users'),orderBy('email')):query(collection(db,'users'),where('tenantId','==',profile.tenantId),orderBy('email')); const snaps=await getDocs(qRef); return snaps.docs.map(d=>({uid:d.id,...d.data()}))}
export async function saveUserProfile(uid,payload){return setDoc(doc(db,'users',uid),{...payload,updatedAt:serverTimestamp()},{merge:true})}
export async function updateUserProfile(uid,payload){return updateDoc(doc(db,'users',uid),{...payload,updatedAt:serverTimestamp()})}
export async function saveWorkbenchSnapshot(profile,snapshot){const id=snapshot.id; const payload={tenantId:profile.tenantId,ownerUid:profile.uid,ownerEmail:profile.email,snapshotId:id,title:snapshot.title||'Untitled assessment',savedAt:snapshot.savedAt||new Date().toISOString(),data:snapshot.data||{},updatedAt:serverTimestamp()}; await setDoc(doc(db,'workbenchSnapshots',id),payload,{merge:true}); await writeAudit(profile,'save_workbench_snapshot','workbenchSnapshot',id,{title:payload.title})}
export async function listWorkbenchSnapshots(profile){const qRef=query(collection(db,'workbenchSnapshots'),where('tenantId','==',profile.tenantId),orderBy('savedAt','desc')); const snaps=await getDocs(qRef); return snaps.docs.map(d=>({id:d.id,...d.data()}))}
export async function deleteWorkbenchSnapshot(profile,snapshotId){await deleteDoc(doc(db,'workbenchSnapshots',snapshotId)); await writeAudit(profile,'delete_workbench_snapshot','workbenchSnapshot',snapshotId,{})}
export async function writeAudit(profile,action,entityType,entityId,details={}){return addDoc(collection(db,'auditLogs'),{tenantId:profile.tenantId||null,actorUid:profile.uid,actorEmail:profile.email,actorRole:profile.role,action,entityType,entityId,details,timestamp:serverTimestamp()})}
export { doc,setDoc,serverTimestamp };
