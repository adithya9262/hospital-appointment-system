// ===== SmartCare Hospital Appointment System =====

const doctorsData = [
  { id:1, name:"Dr. Patel", specialization:"Cardiology", slots:["9:00 AM","10:00 AM","2:00 PM","4:00 PM"], rating:4.8, experience:15 },
  { id:2, name:"Dr. Smith", specialization:"Dermatology", slots:["8:00 AM","11:00 AM","1:00 PM","3:00 PM"], rating:4.6, experience:12 },
  { id:3, name:"Dr. Lee", specialization:"Orthopedics", slots:["10:00 AM","12:00 PM","3:00 PM"], rating:4.9, experience:20 },
  { id:4, name:"Dr. Kumar", specialization:"General Medicine", slots:["9:00 AM","11:00 AM","2:00 PM","4:00 PM","6:00 PM"], rating:4.7, experience:10 },
  { id:5, name:"Dr. Chen", specialization:"Pediatrics", slots:["8:30 AM","10:30 AM","1:30 PM"], rating:4.6, experience:8 },
  { id:6, name:"Dr. Williams", specialization:"Neurology", slots:["10:00 AM","11:00 AM","3:00 PM"], rating:4.5, experience:18 }
];

// --- Storage ---
function getAppointments(){ return JSON.parse(localStorage.getItem('appointments')||'[]'); }
function saveAppointments(a){ localStorage.setItem('appointments',JSON.stringify(a)); }
function getPatients(){ return JSON.parse(localStorage.getItem('patients')||'[]'); }
function savePatients(p){ localStorage.setItem('patients',JSON.stringify(p)); }

// --- Toast ---
function showToast(message,type='info'){
  let c=document.querySelector('.toast-container');
  if(!c){c=document.createElement('div');c.className='toast-container';document.body.appendChild(c);}
  const t=document.createElement('div');t.className=`toast ${type}`;t.textContent=message;c.appendChild(t);
  setTimeout(()=>t.remove(),3000);
}

// --- Navbar ---
function initNavbar(){
  const h=document.querySelector('.hamburger'),n=document.querySelector('.nav-links');
  if(h&&n){h.addEventListener('click',()=>n.classList.toggle('open'));document.addEventListener('click',e=>{if(!e.target.closest('.navbar'))n.classList.remove('open');});}
}

// --- Format Date ---
function formatDate(d){return new Date(d).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});}

// --- Sidebar Navigation ---
function initSidebar(){
  document.querySelectorAll('.sidebar-link').forEach(link=>{
    link.addEventListener('click',e=>{
      e.preventDefault();
      const section=link.dataset.section;
      if(!section)return;
      showSection(section);
      // Update active link
      link.closest('.sidebar-nav').querySelectorAll('.sidebar-link').forEach(l=>l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function showSection(sectionId){
  const main=document.querySelector('.dashboard-main');
  if(!main)return;
  main.querySelectorAll('.dashboard-section').forEach(s=>s.classList.remove('active'));
  const target=document.getElementById(sectionId);
  if(target)target.classList.add('active');
  // Update sidebar active
  document.querySelectorAll('.sidebar-link').forEach(l=>{
    l.classList.toggle('active',l.dataset.section===sectionId);
  });
  // Reset booking wizard when entering booking
  if(sectionId==='bookingSection'){resetBookingWizard();}
}

// ===== DOCTOR FILTERS =====
function renderDoctorFilters(containerId,gridId,selectable){
  const container=document.getElementById(containerId);
  if(!container)return;
  const specs=['All',...new Set(doctorsData.map(d=>d.specialization))];
  container.innerHTML=specs.map(s=>`<button class="filter-btn${s==='All'?' active':''}" data-filter="${s}">${s}</button>`).join('');
  container.querySelectorAll('.filter-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      container.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const filter=btn.dataset.filter;
      const filtered=filter==='All'?doctorsData:doctorsData.filter(d=>d.specialization===filter);
      renderDoctorCards(gridId,filtered,selectable);
    });
  });
}

function renderDoctorCards(gridId,doctors,selectable){
  const grid=document.getElementById(gridId);
  if(!grid)return;
  grid.innerHTML=doctors.map(doc=>{
    const initial=doc.name.replace('Dr. ','').charAt(0);
    return `<div class="doctor-card${selectable?' selectable':''}" data-id="${doc.id}" onclick="${selectable?`selectDoctor(${doc.id})`:''}" id="docCard${doc.id}">
      <div class="doctor-avatar">${initial}</div>
      <h3>${doc.name}</h3>
      <p class="doctor-specialty">${doc.specialization}</p>
      <div class="doctor-meta">
        <span>⭐ ${doc.rating}</span>
        <span>📋 ${doc.experience} years</span>
      </div>
    </div>`;
  }).join('');
}

// ===== DOCTORS PAGE =====
function renderDoctorsPage(){
  renderDoctorFilters('doctorFilters','doctorsGrid',false);
  renderDoctorCards('doctorsGrid',doctorsData,false);
}

// ===== BOOKING WIZARD =====
let selectedDoctor=null, selectedTime=null, currentStep=1;

function resetBookingWizard(){
  selectedDoctor=null;selectedTime=null;currentStep=1;
  renderDoctorFilters('specialtyFilters','bookingDoctorsGrid',true);
  renderDoctorCards('bookingDoctorsGrid',doctorsData,true);
  updateStepUI();
  const d=document.getElementById('apptDate');
  if(d)d.value='';
  const r=document.getElementById('visitReason');
  if(r)r.value='';
  const n=document.getElementById('patientName');
  if(n)n.value='';
  const btn=document.getElementById('step1Next');
  if(btn)btn.disabled=true;
}

function selectDoctor(id){
  selectedDoctor=doctorsData.find(d=>d.id===id);
  document.querySelectorAll('#bookingDoctorsGrid .doctor-card').forEach(c=>{
    c.classList.toggle('selected',parseInt(c.dataset.id)===id);
  });
  const btn=document.getElementById('step1Next');
  if(btn)btn.disabled=false;
}

function goToStep(step){
  if(step===2&&!selectedDoctor){showToast('Please select a doctor','error');return;}
  if(step===3){
    const date=document.getElementById('apptDate')?.value;
    if(!date){showToast('Please select a date','error');return;}
    if(!selectedTime){showToast('Please select a time slot','error');return;}
  }
  currentStep=step;
  updateStepUI();
  if(step===2){
    const title=document.getElementById('step2Title');
    if(title)title.textContent=`Select Date & Time for ${selectedDoctor.name}`;
    renderTimeSlots();
    const dateInput=document.getElementById('apptDate');
    if(dateInput){dateInput.min=new Date().toISOString().split('T')[0];
      dateInput.addEventListener('change',()=>{const b=document.getElementById('step2Next');if(b)b.disabled=!selectedTime;});
    }
  }
  if(step===3)renderConfirmation();
}

function updateStepUI(){
  for(let i=1;i<=3;i++){
    const step=document.getElementById(`step${i}Indicator`);
    const content=document.getElementById(`bookingStep${i}`);
    if(step){
      step.classList.remove('active','completed');
      if(i<currentStep)step.classList.add('completed');
      if(i===currentStep)step.classList.add('active');
      const num=step.querySelector('.step-num');
      if(num)num.textContent=i<currentStep?'✓':i;
    }
    if(content){content.classList.toggle('active',i===currentStep);}
  }
}

function renderTimeSlots(){
  const container=document.getElementById('timeSlots');
  if(!container||!selectedDoctor)return;
  selectedTime=null;
  container.innerHTML=selectedDoctor.slots.map(s=>`<button class="time-slot" onclick="selectTime(this,'${s}')">${s}</button>`).join('');
}

function selectTime(el,time){
  selectedTime=time;
  document.querySelectorAll('.time-slot').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  const btn=document.getElementById('step2Next');
  if(btn)btn.disabled=false;
}

function renderConfirmation(){
  const el=document.getElementById('confirmDetails');
  if(!el)return;
  const date=document.getElementById('apptDate')?.value;
  const reason=document.getElementById('visitReason')?.value||'Not specified';
  el.innerHTML=`<p><strong>Doctor:</strong> ${selectedDoctor.name}</p>
    <p><strong>Specialty:</strong> ${selectedDoctor.specialization}</p>
    <p><strong>Date:</strong> ${formatDate(date)}</p>
    <p><strong>Time:</strong> ${selectedTime}</p>
    <p><strong>Reason:</strong> ${reason}</p>`;
}

function confirmBooking(){
  const name=document.getElementById('patientName')?.value?.trim();
  if(!name){showToast('Please enter your name','error');return;}
  const date=document.getElementById('apptDate')?.value;
  const reason=document.getElementById('visitReason')?.value||'';
  const appt={id:Date.now(),patientName:name,doctor:selectedDoctor.name,specialization:selectedDoctor.specialization,date,time:selectedTime,reason,createdAt:new Date().toISOString()};
  const appts=getAppointments();appts.push(appt);saveAppointments(appts);
  const patients=getPatients();if(!patients.includes(name)){patients.push(name);savePatients(patients);}
  showToast('Appointment booked successfully!','success');
  showSection('appointmentsSection');
  renderPatientDashboard();
}

// ===== PATIENT DASHBOARD =====
function renderPatientDashboard(){
  const appts=getAppointments();
  const now=new Date();
  const upcoming=appts.filter(a=>new Date(a.date)>=now).length;
  const completed=appts.filter(a=>new Date(a.date)<now).length;
  const el=id=>document.getElementById(id);
  if(el('patTotalAppt'))el('patTotalAppt').textContent=appts.length;
  if(el('patCompleted'))el('patCompleted').textContent=completed;
  if(el('patUpcoming'))el('patUpcoming').textContent=upcoming;
  if(el('patCancelled'))el('patCancelled').textContent='0';
  renderReminders();
  renderPatientAppointments();
}

function renderReminders(){
  const el=document.getElementById('remindersList');
  const all=document.getElementById('allRemindersList');
  const appts=getAppointments();
  const reminders=[];
  appts.forEach(a=>{
    const d=new Date(a.date);const now=new Date();
    const diff=Math.ceil((d-now)/(1000*60*60*24));
    if(diff>=0&&diff<=7)reminders.push({text:`Appointment with ${a.doctor} on ${formatDate(a.date)} at ${a.time}`,badge:diff===0?'Today':diff===1?'Tomorrow':`${diff} days`});
  });
  if(reminders.length===0){
    const empty='<p style="padding:1.5rem;text-align:center;color:var(--text-muted);">No upcoming reminders</p>';
    if(el)el.innerHTML=empty;if(all)all.innerHTML=empty;return;
  }
  const html=reminders.map(r=>`<div class="reminder-item"><p>${r.text}</p><span class="reminder-badge">${r.badge}</span></div>`).join('');
  if(el)el.innerHTML=html;if(all)all.innerHTML=html;
}

function renderPatientAppointments(){
  const container=document.getElementById('appointmentsList');
  if(!container)return;
  const appts=getAppointments();
  if(appts.length===0){container.innerHTML='<div class="no-appointments"><div class="empty-icon">📋</div><h3>No Appointments Yet</h3><p>Book your first appointment to get started.</p></div>';return;}
  container.innerHTML=appts.map(a=>`<div class="appointment-item" data-id="${a.id}">
    <div class="appt-details"><div class="appt-icon">🩺</div><div class="appt-text"><h4>${a.patientName}</h4><p>${a.doctor} • ${formatDate(a.date)} at ${a.time}</p></div></div>
    <button class="btn btn-danger btn-sm" onclick="cancelAppointment(${a.id})">✕ Cancel</button></div>`).join('');
}

function cancelAppointment(id){
  let a=getAppointments();a=a.filter(x=>x.id!==id);saveAppointments(a);
  showToast('Appointment cancelled','error');
  renderPatientDashboard();
  if(typeof renderAdminDashboard==='function')renderAdminDashboard();
}

// ===== ADMIN =====
function renderAdminDashboard(){
  const appts=getAppointments();const patients=getPatients();
  const el=id=>document.getElementById(id);
  if(el('totalAppointments'))el('totalAppointments').textContent=appts.length;
  if(el('totalDoctors'))el('totalDoctors').textContent=doctorsData.length;
  if(el('totalPatients'))el('totalPatients').textContent=patients.length;
  renderChart(appts);renderDeptChart();renderAdminAppointments(appts);renderPatientsList(patients);
}

function renderChart(appts){
  const c=document.getElementById('chartBars');if(!c)return;
  const counts={};doctorsData.forEach(d=>counts[d.name]=0);
  appts.forEach(a=>{if(counts[a.doctor]!==undefined)counts[a.doctor]++;});
  const max=Math.max(...Object.values(counts),1);
  const colors=['#00bcd4','#0ea5e9','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  c.innerHTML=Object.entries(counts).map(([name,count],i)=>{
    const h=(count/max)*140+10;const short=name.replace('Dr. ','');
    return `<div class="chart-bar-wrapper"><div class="chart-bar" style="height:${h}px;background:${colors[i%colors.length]}"><span class="bar-value">${count}</span></div><div class="chart-bar-label">${short}</div></div>`;
  }).join('');
}

function renderDeptChart(){
  const el=document.getElementById('deptChart');if(!el)return;
  const depts={};doctorsData.forEach(d=>{depts[d.specialization]=(depts[d.specialization]||0)+1;});
  const total=Object.values(depts).reduce((a,b)=>a+b,0);
  const colors=['#00bcd4','#8b5cf6','#10b981','#f59e0b','#ef4444','#0ea5e9'];
  el.innerHTML=Object.entries(depts).map(([name,count],i)=>{
    const pct=Math.round(count/total*100);
    return `<div class="dept-item"><div class="dept-color" style="background:${colors[i%colors.length]}"></div>${name} ${pct}%</div>`;
  }).join('');
}

function renderAdminAppointments(appts){
  const c=document.getElementById('adminAppointments');if(!c)return;
  if(appts.length===0){c.innerHTML='<div class="no-appointments"><div class="empty-icon">📋</div><h3>No Appointments</h3><p>No appointments booked yet.</p></div>';return;}
  c.innerHTML=appts.map(a=>`<div class="appointment-item" data-id="${a.id}">
    <div class="appt-details"><div class="appt-icon">🩺</div><div class="appt-text"><h4>${a.patientName}</h4><p>${a.doctor} • ${formatDate(a.date)} at ${a.time}</p></div></div>
    <button class="btn btn-danger btn-sm" onclick="deleteAppointment(${a.id})">🗑 Delete</button></div>`).join('');
}

function renderPatientsList(patients){
  const c=document.getElementById('patientsList');if(!c)return;
  if(patients.length===0){c.innerHTML='<p style="padding:2rem;text-align:center;color:var(--text-muted);">No registered patients yet.</p>';return;}
  c.innerHTML=patients.map(p=>`<div class="appointment-item"><div class="appt-details"><div class="appt-icon">👤</div><div class="appt-text"><h4>${p}</h4><p>Registered Patient</p></div></div></div>`).join('');
}

function deleteAppointment(id){
  let a=getAppointments();a=a.filter(x=>x.id!==id);saveAppointments(a);
  showToast('Appointment deleted','error');renderAdminDashboard();
}

// --- Admin Auth ---
function initAdminLogin(){
  const form=document.getElementById('adminLoginForm');if(!form)return;
  if(sessionStorage.getItem('adminLoggedIn')==='true')showDashboard();
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const u=document.getElementById('adminUsername').value.trim();
    const p=document.getElementById('adminPassword').value.trim();
    if(u==='admin'&&p==='admin123'){
      sessionStorage.setItem('adminLoggedIn','true');
      showToast('Welcome, Admin!','success');showDashboard();
    }else{
      const err=document.getElementById('adminError');if(err)err.style.display='block';
    }
  });
}

function showDashboard(){
  const o=document.getElementById('adminLoginOverlay');
  const d=document.getElementById('dashboardContent');
  if(o)o.classList.add('hidden');
  if(d)d.classList.remove('hidden');
  const logBtn=document.getElementById('adminLogoutNav');
  if(logBtn)logBtn.style.display='';
  renderAdminDashboard();
}

function adminLogout(){
  sessionStorage.removeItem('adminLoggedIn');
  const o=document.getElementById('adminLoginOverlay');
  const d=document.getElementById('dashboardContent');
  if(o)o.classList.remove('hidden');
  if(d)d.classList.add('hidden');
  showToast('Logged out','info');
}

// --- Init ---
document.addEventListener('DOMContentLoaded',()=>{
  initNavbar();
  initSidebar();
  initAdminLogin();
  renderDoctorsPage();
  renderPatientDashboard();
  // Init booking wizard if on patient page
  if(document.getElementById('bookingStep1'))resetBookingWizard();
});
