import React, { useState, useEffect } from 'react';
import { Users, Activity, FileText, CheckCircle2, X, BrainCircuit, BarChart3, ShieldCheck, AlertTriangle, Loader2, ScanFace, Database, Calendar, LogOut } from 'lucide-react';
import { api } from '../utils/api';

const DoctorDashboard = () => {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [prescription, setPrescription] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  const DEXA_LABELS = {
    fnt: "Femoral Neck T-Score (DEXA Scan)",
    calcitriol: "Active Vitamin D (1,25-Dihydroxy Vitamin D) (pg/mL)",
    uric: "Uric Acid (mg/dL)",
    alt: "Alanine Aminotransferase (ALT) (U/L)",
    bun: "Blood Urea Nitrogen (BUN) (mg/dL)",
    crea: "Serum Creatinine (mg/dL)",
    fbg: "Fasting Blood Glucose (FBG) (mg/dL)",
    ldl_c: "LDL Cholesterol (mg/dL)",
    l1_4t: "Lumbar Spine (L1–L4) T-Score (DEXA Scan)",
    age: "Age (Years)",
    hdl_c: "HDL Cholesterol (mg/dL)",
    bmi: "Body Mass Index (BMI) (kg/m²)",
    ca: "Serum Calcium (mg/dL)",
    p: "Serum Phosphorus (mg/dL)",
    height: "Height (cm)",
    ast: "Aspartate Aminotransferase (AST) (U/L)",
    weight: "Weight (kg)",
    calsium: "Calcium Supplement Intake",
    calcitonin: "Calcitonin Hormone (pg/mL)",
    as_: "Ankylosing Spondylitis"
  };
  
  const [form, setForm] = useState({
    fnt: -1.5, calcitriol: 30.5, uric: 5.2, alt: 25.0, bun: 15.0,
    crea: 0.9, fbg: 90.0, ldl_c: 110.0, l1_4t: -1.2, age: 65,
    hdl_c: 50.0, bmi: 24.5, ca: 9.2, p: 3.5, height: 165.0,
    ast: 22.0, weight: 68.0, calsium: 1, calcitonin: 12.0, as_: 0
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch('http://localhost:7860/api/v1/doctor/patients', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}` }
      });
      const data = await res.json();
      if(data.status === 'success') {
        setPatients(data.patients.filter(p => p.questionnaire_filled));
      }
    } catch(err) {
      console.error(err);
    }
  };

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleRequest = async (req) => {
    try {
      const res = await fetch('http://localhost:7860/api/v1/doctor/request_action', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patient_id: selectedPatient.id,
          action: req,
          medication: prescription
        })
      });
      if(res.ok) {
        setPatients(pts => pts.map(p => p.id === selectedPatient.id ? { ...p, request: req } : p));
        setSelectedPatient({ ...selectedPatient, request: req });
        setPrescription('');
      }
    } catch(err) {
      alert("Error saving action");
    }
  };

  const handlePredictDexa = async () => {
    setIsProcessing(true);
    setProcessingText('Ingesting tabular features...');
    await new Promise(r => setTimeout(r, 1000));
    setProcessingText('Executing Ensemble ML Model Pipeline...');
    await new Promise(r => setTimeout(r, 1200));
    setProcessingText('Generating probability distributions...');
    await new Promise(r => setTimeout(r, 800));

    try {
      const res = await fetch('http://localhost:7860/api/v1/predict/ml-dexa', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...form, patient_id: selectedPatient.id })
      });
      const data = await res.json();
      setIsProcessing(false);
      
      if(data.status === 'success') {
        setPredictionResult({
           type: 'DEXA Tabular ML',
           prediction: data.prediction,
           confidence: data.confidence,
           probabilities: data.probabilities,
           pdf_url: data.pdf_url
        });
        setActionModal(null);
        setSelectedPatient(null);
        fetchPatients();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch(err) {
      setIsProcessing(false);
      alert(`Prediction failed: ${err.message}`);
    }
  };


  const handleAssignAppointment = async () => {
    try {
      const res = await fetch('http://localhost:7860/api/v1/doctor/assign-appointment', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('osteocare_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ patient_id: selectedPatient.id, appointment_time: appointmentTime })
      });
      if(res.ok) {
        setAppointmentTime('');
        fetchPatients();
        setSelectedPatient(prev => ({ ...prev, appointment_time: appointmentTime }));
      }
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <nav className="glass-panel rounded-none border-t-0 border-l-0 border-r-0 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Activity className="text-teal-600" />
          <span className="font-bold text-lg text-slate-800">OsteoVerse Doctor Portal</span>
        </div>
        <button onClick={() => { localStorage.clear(); window.location.href = '/'; }} className="text-slate-600 hover:text-red-500 transition-colors ml-4 flex items-center gap-2">
          <LogOut size={20} />
          <span className="hidden sm:inline text-sm font-bold">Logout</span>
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-6 grid lg:grid-cols-3 gap-6 mt-6 w-full flex-1">
        
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Assigned Patients</h2>
          {patients.length === 0 && <div className="text-slate-500 italic">No patients assigned yet.</div>}
          {patients.map(p => (
            <div 
              key={p.id} 
              onClick={() => setSelectedPatient(p)}
              className={`glass-card p-4 cursor-pointer transition-all ${selectedPatient?.id === p.id ? 'border-teal-400 bg-teal-900/20' : 'hover:border-slate-500'}`}
            >
              <div className="font-bold text-slate-800">{p.name}</div>
              <div className={`text-sm font-semibold mt-1 ${p.initialRisk === 'High Risk' ? 'text-red-400' : 'text-teal-600'}`}>
                Initial Scan: {p.initialRisk}
              </div>
              {p.request && <div className="text-xs text-amber-600 mt-2">Requested: {p.request}</div>}
              {p.appointment_requested && !p.appointment_time && <div className="text-xs text-indigo-600 mt-1 font-bold">Appointment Requested</div>}
            </div>
          ))}
        </div>

        {/* Patient Detail / Actions */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <div className="glass-panel p-6 animate-fade-in">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{selectedPatient.name}</h2>
              <div className="flex gap-4 mb-6">
                <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border ${selectedPatient.initialRisk === 'High Risk' ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-teal-500/50 bg-teal-500/10 text-teal-600'}`}>
                  <div className="text-xs font-normal text-slate-600 mb-1">AI Prediction (Without DEXA)</div>
                  {selectedPatient.initialRisk}
                </div>
                {selectedPatient.final_prediction && (
                  <div className={`inline-block px-4 py-2 rounded-xl text-sm font-bold border ${selectedPatient.final_prediction === 'Osteoporosis' || selectedPatient.final_prediction === 'Osteopenia' ? 'border-amber-500/50 bg-amber-500/10 text-amber-600' : 'border-blue-500/50 bg-blue-500/10 text-blue-400'}`}>
                    <div className="text-xs font-normal text-slate-600 mb-1">Updated AI Prediction (DEXA)</div>
                    {selectedPatient.final_prediction}
                  </div>
                )}
              </div>

              {!selectedPatient.request ? (
                <div>
                  <h3 className="text-lg font-medium text-slate-700 mb-4">Doctor Actions</h3>
                  
                  <div className="mb-6">
                    <label className="text-sm text-slate-600 block mb-1">Prescribe Medication / Notes</label>
                    <textarea 
                      value={prescription}
                      onChange={e => setPrescription(e.target.value)}
                      placeholder="e.g. Prescribed Vitamin D 600mg daily..."
                      className="input-glass w-full h-24 p-3"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <button onClick={() => handleRequest('DEXA')} className="btn-primary flex-col py-4 gap-2">
                      <FileText /> Request DEXA Scan
                    </button>
                    <button onClick={() => handleRequest('Reviewed')} className="glass-card flex-col py-4 gap-2 text-slate-700 hover:text-slate-800 hover:border-white">
                      <CheckCircle2 /> Mark as Reviewed
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/30 p-6 rounded-xl">
                  <h3 className="text-lg font-bold text-amber-600 mb-2">Pending {selectedPatient.request} Results</h3>
                  <p className="text-slate-700 mb-4">The patient has been notified. Upload the results once available.</p>
                  {selectedPatient.request !== 'Reviewed' && (
                    <button onClick={() => setActionModal(selectedPatient.request.toLowerCase())} className="btn-primary">
                      Upload {selectedPatient.request} Results
                    </button>
                  )}
                </div>
              )}
              
              {/* Appointment Assignment Section */}
              {selectedPatient.appointment_requested && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2 mb-4">
                    <Calendar className="text-indigo-600" size={20} /> Appointment Scheduling
                  </h3>
                  {!selectedPatient.appointment_time ? (
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-sm text-slate-600 block mb-1">Select Date & Time</label>
                        <input 
                          type="datetime-local" 
                          value={appointmentTime}
                          onChange={e => setAppointmentTime(e.target.value)}
                          className="input-glass w-full"
                        />
                      </div>
                      <button onClick={handleAssignAppointment} disabled={!appointmentTime} className="btn-primary bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                        Assign Time
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex justify-between items-center">
                      <span><strong>Scheduled for:</strong> {new Date(selectedPatient.appointment_time).toLocaleString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 glass-panel">
              Select a patient to view details
            </div>
          )}
        </div>

      </main>

      {/* Modals */}
      {actionModal === 'dexa' && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Input DEXA Scan Values</h2>
              <button onClick={() => setActionModal(null)} className="text-slate-600 hover:text-slate-800"><X /></button>
            </div>
            <p className="text-sm text-slate-600 mb-4">Enter the 20 standardized features for the ML model.</p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.keys(form).map(key => (
                <div key={key}>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 truncate" title={DEXA_LABELS[key] || key}>
                    {DEXA_LABELS[key] || key}
                  </label>
                  <input type="number" step="0.01" value={form[key]} onChange={e => set(key, parseFloat(e.target.value))} className="input-glass w-full" />
                </div>
              ))}
            </div>
            
            <button onClick={handlePredictDexa} className="btn-primary w-full">Generate AI Prediction & Report</button>
          </div>
        </div>
      )}


      {/* Premium Prediction Result Modal */}
      {predictionResult && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`relative max-w-lg w-full p-8 rounded-2xl border ${
              predictionResult.prediction === 'Healthy' || predictionResult.prediction === 'Normal' 
                ? 'border-emerald-500/50 bg-emerald-950/20' 
                : predictionResult.prediction === 'Osteopenia' 
                  ? 'border-amber-500/50 bg-amber-950/20'
                  : 'border-rose-500/50 bg-rose-950/20'
            } shadow-2xl shadow-black`}>
            
            <div className="absolute top-4 right-4">
              <button onClick={() => setPredictionResult(null)} className="text-slate-600 hover:text-slate-800 transition-colors"><X /></button>
            </div>

            <div className="text-center mb-8 mt-2">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${
                  predictionResult.prediction === 'Healthy' || predictionResult.prediction === 'Normal' 
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-emerald-500/20' 
                    : predictionResult.prediction === 'Osteopenia' 
                      ? 'bg-amber-500/20 text-amber-600 shadow-amber-500/20'
                      : 'bg-rose-500/20 text-rose-400 shadow-rose-500/20'
                }`}>
                {predictionResult.prediction === 'Healthy' || predictionResult.prediction === 'Normal' ? <ShieldCheck size={48} /> : <AlertTriangle size={48} />}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Analysis Complete</h2>
              <p className="text-slate-600 font-mono text-sm flex items-center justify-center gap-2">
                <BrainCircuit size={16} className="text-teal-600"/>
                {predictionResult.type} inference finished
              </p>
            </div>


            <div className="space-y-4 mb-8">
              <div className="bg-white/80 rounded-xl p-5 border border-slate-200 flex justify-between items-center shadow-inner">
                <span className="text-slate-600 font-medium flex items-center gap-2">
                  <BarChart3 size={18}/> Predicted Class
                </span>
                <span className={`text-2xl font-black tracking-wide ${
                  predictionResult.prediction === 'Healthy' || predictionResult.prediction === 'Normal' ? 'text-emerald-400' : predictionResult.prediction === 'Osteopenia' ? 'text-amber-600' : 'text-rose-400'
                }`}>{predictionResult.prediction.toUpperCase()}</span>
              </div>
              
              <div className="bg-white/80 rounded-xl p-5 border border-slate-200 shadow-inner">
                <div className="mb-4">
                  <span className="text-slate-600 font-medium text-sm flex items-center gap-2 mb-3"><Database size={14}/> Probability Distribution</span>
                  {predictionResult.probabilities && Object.entries(predictionResult.probabilities).map(([key, val]) => (
                    <div key={key} className="mb-3 last:mb-0">
                      <div className="flex justify-between text-xs mb-1 font-mono">
                        <span className={key === 'Normal' || key === 'Healthy' ? 'text-emerald-400' : key === 'Osteopenia' ? 'text-amber-600' : 'text-rose-400'}>{key}</span>
                        <span className="text-slate-800">{val}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            key === 'Normal' || key === 'Healthy' ? 'bg-emerald-500' : key === 'Osteopenia' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${val}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setPredictionResult(null)} className="flex-1 py-3 px-4 rounded-xl font-bold bg-white text-slate-800 hover:bg-slate-200 transition-colors border border-slate-200">
                Dismiss
              </button>
              {predictionResult.pdf_url && (
                <button onClick={() => window.open(`http://localhost:7860${predictionResult.pdf_url}`, '_blank')} className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-slate-800 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2 border border-blue-400/30">
                  <FileText size={18} /> View PDF Report
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI Processing Modal */}
      {isProcessing && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
          <div className="flex flex-col items-center justify-center text-center">
            <ScanFace className="w-24 h-24 text-teal-600 animate-pulse mb-6" />
            <div className="flex items-center gap-3 text-2xl font-bold text-slate-800 mb-2">
              <Loader2 className="animate-spin text-teal-500" />
              AI Analysis in Progress
            </div>
            <p className="text-teal-600 font-mono text-sm animate-pulse">{processingText}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;
