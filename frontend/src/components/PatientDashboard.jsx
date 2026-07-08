import React, { useState, useEffect } from 'react';
import { Activity, AlertCircle, FileText, Pill, Calendar, LogOut } from 'lucide-react';
import { api } from '../utils/api';

const PatientDashboard = () => {
  const user = JSON.parse(localStorage.getItem('osteocare_user')) || { name: 'Patient' };
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isRetaking, setIsRetaking] = useState(false);

  const [form, setForm] = useState({
    Age: '', Gender: '', Hormonal_Changes: 'Normal', Family_History: 'No', Race_Ethnicity: 'Caucasian',
    Body_Weight: 'Normal', Calcium_Intake: 'Adequate', Vitamin_D_Intake: 'Sufficient',
    Physical_Activity: 'Active', Smoking: 'No', Alcohol_Consumption: 'None',
    Medical_Conditions: 'None', Medications: 'None', Prior_Fractures: 'No'
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:7860/api/v1/patient/profile', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}` }
      });
      const data = await res.json();
      if(data.status === 'success') {
        setProfile(data.profile);
      }
    } catch(err) {
      setError('Failed to load profile');
    }
    setLoading(false);
  };

  const handleRequestAppointment = async () => {
    try {
      const res = await fetch('http://localhost:7860/api/v1/patient/request-appointment', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}` }
      });
      if(res.ok) {
        fetchProfile();
      }
    } catch(err) {
      console.error(err);
    }
  };

  const setF = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmitQuestionnaire = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submissionData = { ...form };
    if (submissionData.Gender === 'Male') {
      submissionData.Hormonal_Changes = 'Normal';
    }

    try {
      const res = await fetch('http://localhost:7860/api/v1/patient/submit-questionnaire', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionData)
      });
      const data = await res.json();
      if(data.status === 'success') {
        setIsRetaking(false);
        await fetchProfile();
      } else {
        alert(data.message);
      }
    } catch(err) {
      alert('Submission failed');
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <nav className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-600" />
          <span className="font-bold text-lg tracking-wide text-slate-800">OsteoVerse</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-slate-800">{user.name}</div>
            <div className="text-xs text-slate-600">Patient Portal</div>
          </div>
          <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-slate-600 hover:text-red-500 transition-colors ml-4 flex items-center gap-2">
            <LogOut size={20} />
            <span className="hidden sm:inline text-sm font-bold">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto w-full p-6 mt-6 flex-1 flex flex-col gap-6">
        
        {(!profile?.questionnaire_filled || isRetaking) ? (
          <div className="glass-panel p-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Health Assessment</h2>
            <p className="text-slate-600 mb-6">Please complete this questionnaire. Your assigned doctor will review your responses.</p>
            
            <form onSubmit={handleSubmitQuestionnaire} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/40 p-6 rounded-2xl border border-teal-100">
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Age</label>
                  <input required type="number" value={form.Age} onChange={e => setF('Age', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm" placeholder="e.g. 65" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Gender</label>
                  <select required value={form.Gender} onChange={e => setF('Gender', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option value="" disabled>Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Race/Ethnicity</label>
                  <select required value={form.Race_Ethnicity} onChange={e => setF('Race_Ethnicity', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option value="" disabled>Select Ethnicity</option>
                    <option value="African American">African American</option>
                    <option value="Asian">Asian</option>
                    <option value="Caucasian">Caucasian</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Body Weight</label>
                  <select value={form.Body_Weight} onChange={e => setF('Body_Weight', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>Underweight</option>
                    <option>Normal</option>
                    <option>Overweight</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Calcium Intake</label>
                  <select value={form.Calcium_Intake} onChange={e => setF('Calcium_Intake', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>Low</option>
                    <option>Adequate</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Vitamin D Intake</label>
                  <select value={form.Vitamin_D_Intake} onChange={e => setF('Vitamin_D_Intake', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>Insufficient</option>
                    <option>Sufficient</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Physical Activity</label>
                  <select value={form.Physical_Activity} onChange={e => setF('Physical_Activity', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>Sedentary</option>
                    <option>Active</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Smoking</label>
                  <select value={form.Smoking} onChange={e => setF('Smoking', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Alcohol Consumption</label>
                  <select value={form.Alcohol_Consumption} onChange={e => setF('Alcohol_Consumption', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>None</option>
                    <option>Moderate</option>
                    <option>High</option>
                  </select>
                </div>
                {form.Gender !== 'Male' && (
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-teal-800">Hormonal Changes</label>
                    <select value={form.Hormonal_Changes} onChange={e => setF('Hormonal_Changes', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                      <option>Normal</option>
                      <option>Postmenopausal</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Family History</label>
                  <select value={form.Family_History} onChange={e => setF('Family_History', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Medical Conditions</label>
                  <select value={form.Medical_Conditions} onChange={e => setF('Medical_Conditions', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>None</option>
                    <option>Hyperthyroidism</option>
                    <option>Rheumatoid Arthritis</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Medications</label>
                  <select value={form.Medications} onChange={e => setF('Medications', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>None</option>
                    <option>Corticosteroids</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-semibold text-teal-800">Prior Fractures</label>
                  <select value={form.Prior_Fractures} onChange={e => setF('Prior_Fractures', e.target.value)} className="input-glass w-full bg-white border-teal-100 focus:border-teal-500 focus:ring-teal-500/20 shadow-sm">
                    <option>No</option>
                    <option>Yes</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-teal-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  <Activity size={24} /> Submit Health Assessment
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* Status Header */}
            <div className="glass-panel p-8 text-center animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome, {user.name}</h2>
              <p className="text-slate-600">Your health assessment has been submitted securely to your doctor.</p>
              
              {!profile.doctor_request && !profile.prescribed_medication && (
                <div className="mt-6 inline-flex items-center gap-3 bg-teal-50 border border-teal-500/30 rounded-full px-6 py-3">
                  <span className="text-slate-700">Status:</span>
                  <span className="font-bold text-amber-600">Waiting for Doctor's Review...</span>
                </div>
              )}
            </div>

            {/* Appointment Section */}
            <div className="bg-white/60 border border-slate-200 rounded-xl p-6 flex flex-col gap-4 animate-slide-up mt-6 shadow-sm">
              <div className="flex items-center gap-3">
                <Calendar className="text-indigo-600" size={28} />
                <h3 className="text-lg font-bold text-slate-800">Doctor Appointment</h3>
              </div>
              
              {!profile.appointment_requested && !profile.appointment_time && (
                <div>
                  <p className="text-slate-600 mb-4">You can request an appointment with your assigned doctor for a consultation.</p>
                  <button onClick={handleRequestAppointment} className="btn-primary bg-indigo-600 hover:bg-indigo-700">Request Appointment</button>
                </div>
              )}
              
              {profile.appointment_requested && !profile.appointment_time && (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg text-indigo-800">
                  <span className="font-semibold">Appointment Requested!</span> Waiting for your doctor to assign a time.
                </div>
              )}
              
              {profile.appointment_time && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-green-800">
                  <span className="font-semibold">Appointment Scheduled:</span> {new Date(profile.appointment_time).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            {/* Doctor Review & Prescriptions */}
            {(profile.doctor_request === 'Reviewed' || profile.prescribed_medication) && (
              <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-6 flex gap-4 animate-slide-up">
                <Activity className="text-teal-600 shrink-0" size={28} />
                <div className="w-full">
                  <h3 className="text-lg font-bold text-teal-600 mb-1">
                    {profile.doctor_request === 'Reviewed' ? 'File Reviewed by Doctor' : 'Doctor\'s Orders & Notes'}
                  </h3>
                  {profile.doctor_request === 'Reviewed' && (
                    <p className="text-slate-700 mb-3">Your assigned doctor has reviewed your assessment and file.</p>
                  )}
                  {profile.prescribed_medication && (
                    <div className="bg-white/60 border border-teal-200 p-4 rounded-lg">
                      <h4 className="font-semibold text-teal-700 flex items-center gap-2 mb-2">
                        <Pill size={18} /> Prescription & Advice
                      </h4>
                      <p className="text-slate-700 whitespace-pre-wrap">{profile.prescribed_medication}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Doctor Request Alert */}
            {profile.doctor_request && profile.doctor_request !== 'Reviewed' && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 flex gap-4 animate-slide-up">
                <AlertCircle className="text-amber-600 shrink-0" size={28} />
                <div>
                  <h3 className="text-lg font-bold text-amber-600 mb-1">Action Required</h3>
                  <p className="text-slate-700 mb-4">
                    Your assigned doctor has requested a 
                    <strong className="text-slate-800"> DEXA Scan (Bone Density)</strong>.
                  </p>
                  <div className="bg-slate-100 p-4 rounded-lg text-sm text-slate-600">
                    Please visit the clinic to get this scan completed. Once completed, your doctor will upload and review the results.
                  </div>
                </div>
              </div>
            )}
            

            
            {/* Download Report Section */}
            {profile.pdf_url && (
              <div className="pt-4 animate-slide-up">
                <a 
                  href={`http://localhost:7860${profile.pdf_url}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-6 py-3 rounded-xl font-bold transition-colors"
                >
                  <FileText size={20} />
                  Download Medical Report (PDF)
                </a>
              </div>
            )}
            
            <div className="pt-6 text-center animate-slide-up">
              <button onClick={() => setIsRetaking(true)} className="btn-secondary border border-teal-500/30 text-teal-600 hover:bg-teal-500/10 px-6 py-2 rounded-lg transition-colors">
                Submit New Assessment
              </button>
            </div>
          </>
        )}

      </main>
      
      {profile?.questionnaire_filled && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
          <div className="mb-4 mr-2 relative animate-bounce">
            <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border border-teal-100 text-teal-800 font-bold text-sm">
              Ask me anything!
            </div>
            <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-b border-r border-teal-100 rotate-45 shadow-sm rounded-br-sm"></div>
          </div>
          <zapier-interfaces-chatbot-embed is-popup="true" default-open="false" chatbot-id="cmr8uxrg5002tkpepo5u4omgi"></zapier-interfaces-chatbot-embed>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
