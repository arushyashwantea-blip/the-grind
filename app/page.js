"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Link as LinkIcon, ChevronLeft, ChevronRight } from "lucide-react";

const SUBJECTS = ["Maths","Physics","Chemistry"];

// ---- Dark UI helpers ----
const INPUT_CLS = "bg-black text-white border-gray-700 placeholder-gray-500";
const TEXTAREA_CLS = "bg-black text-white border-gray-700 placeholder-gray-500";
const OUTLINE_BTN_CLS = "bg-gray-900/60 border-gray-500 text-white opacity-100 hover:bg-gray-800 hover:text-white";

function uid(){return Math.random().toString(36).slice(2,9);} 

function dayKey(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const da=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${da}`;
}

function daysBetween(aStr,bStr){
  // aStr/bStr in YYYY-MM-DD
  if(!aStr||!bStr) return 0;
  const a=new Date(aStr+"T00:00:00");
  const b=new Date(bStr+"T00:00:00");
  return Math.floor((b-a)/(1000*60*60*24));
}

function addDays(dateStr, delta){
  const d = new Date(dateStr+"T00:00:00");
  d.setDate(d.getDate()+delta);
  return dayKey(d);
}

function keyStatus(dateStr){
  return `studyStatus_${dateStr}`;
}

function keyMins(dateStr){
  return `focusMins_${dateStr}`;
}

function keySessions(dateStr){
  return `focusSessions_${dateStr}`;
}

function keyDur(dateStr, dur){
  // how many sessions of a given duration were completed on that day
  return `focusDur_${dur}_${dateStr}`;
}

function ymFromDate(d){
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

function monthStart(ym){
  const [y,m]=ym.split("-").map(Number);
  return new Date(y, m-1, 1);
}

function daysInMonth(ym){
  const [y,m]=ym.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}
export default function App(){
 const [tab,setTab]=useState("dashboard");

 // ---- Persistent data (saved on this laptop) ----
 const [tasks,setTasks]=useState(()=>{
   try{ return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("grind_tasks")||"[]") : []; }catch{ return []; }
 });
 const [notes,setNotes]=useState(()=>{
   try{ return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("grind_notes")||"[]") : []; }catch{ return []; }
 });
 const [resources,setResources]=useState(()=>{
   try{ return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("grind_resources")||"[]") : []; }catch{ return []; }
 });
 const [tests,setTests]=useState(()=>{
   try{ return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("grind_tests")||"[]") : []; }catch{ return []; }
 });
 const [topics,setTopics]=useState(()=>{
   try{ return typeof window !== "undefined" ? JSON.parse(localStorage.getItem("grind_topics")||"[]") : []; }catch{ return []; }
 });

 useEffect(()=>{ if(typeof window !== "undefined") localStorage.setItem("grind_tasks", JSON.stringify(tasks)); },[tasks]);
 useEffect(()=>{ if(typeof window !== "undefined") localStorage.setItem("grind_notes", JSON.stringify(notes)); },[notes]);
 useEffect(()=>{ if(typeof window !== "undefined") localStorage.setItem("grind_resources", JSON.stringify(resources)); },[resources]);
 useEffect(()=>{ if(typeof window !== "undefined") localStorage.setItem("grind_tests", JSON.stringify(tests)); },[tests]);
 useEffect(()=>{ if(typeof window !== "undefined") localStorage.setItem("grind_topics", JSON.stringify(topics)); },[topics]);

 // ---- Backup (Export/Import) ----

 function exportBackup(){
   if(typeof window === "undefined") return;
   const payload = {
     version: 1,
     savedAt: new Date().toISOString(),
     data: {
       tasks,
       notes,
       resources,
       tests,
       topics,
       // key localStorage stats
       prideStreak: typeof window !== "undefined" ? localStorage.getItem("prideStreak") || "0" : "0",
       powerLevel: typeof window !== "undefined" ? localStorage.getItem("powerLevel") || "0" : "0",
       todayFocus: typeof window !== "undefined" ? localStorage.getItem("todayFocus") || "" : "",
       lastStudyDay: typeof window !== "undefined" ? localStorage.getItem("lastStudyDay") || "" : "",
       lastPenaltyDay: typeof window !== "undefined" ? localStorage.getItem("lastPenaltyDay") || "" : "",
       nextExamDate: typeof window !== "undefined" ? localStorage.getItem("nextExamDate") || "" : "",
       goalMarks: typeof window !== "undefined" ? localStorage.getItem("goalMarks") || "" : "",
       // focus history (all days)
       focusMins: typeof window !== "undefined" ? Object.fromEntries(
         Object.keys(localStorage)
           .filter((k)=>k.startsWith("focusMins_") || k.startsWith("focusSessions_") || k.startsWith("studyStatus_") || k.startsWith("focusDur_"))
           .map((k)=>[k, localStorage.getItem(k)])
       ) : {},
       pomoMinutes: typeof window !== "undefined" ? localStorage.getItem("pomoMinutes") || "25" : "25",
       lastCalendarCheck: typeof window !== "undefined" ? localStorage.getItem("lastCalendarCheck") || "" : "",
     }
   };

   const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
   const url = URL.createObjectURL(blob);
   const a = document.createElement("a");
   a.href = url;
   a.download = `the-grind-backup-${dayKey()}.json`;
   a.click();
   URL.revokeObjectURL(url);
 }

 function importBackupFile(file){
   if(typeof window === "undefined") return;
   reader.onload = () => {
     try{
       const parsed = JSON.parse(String(reader.result||"{}"));
       const d = parsed?.data;
       if(!d) throw new Error("Invalid backup file");

       // restore arrays
       setTasks(Array.isArray(d.tasks)?d.tasks:[]);
       setNotes(Array.isArray(d.notes)?d.notes:[]);
       setResources(Array.isArray(d.resources)?d.resources:[]);
       setTests(Array.isArray(d.tests)?d.tests:[]);
       setTopics(Array.isArray(d.topics)?d.topics:[]);

       // restore stats keys
       localStorage.setItem("prideStreak", String(d.prideStreak||"0"));
       localStorage.setItem("powerLevel", String(d.powerLevel||"0"));
       if(d.todayFocus!==undefined) localStorage.setItem("todayFocus", String(d.todayFocus||""));
       if(d.lastStudyDay!==undefined) localStorage.setItem("lastStudyDay", String(d.lastStudyDay||""));
       if(d.lastPenaltyDay!==undefined) localStorage.setItem("lastPenaltyDay", String(d.lastPenaltyDay||""));
       if(d.nextExamDate!==undefined) localStorage.setItem("nextExamDate", String(d.nextExamDate||""));
       if(d.goalMarks!==undefined) localStorage.setItem("goalMarks", String(d.goalMarks||""));

       // restore focus map (minutes/sessions/status/duration buckets)
       if(d.focusMins && typeof d.focusMins === "object"){
         Object.keys(d.focusMins).forEach((k)=>{
           if(k.startsWith("focusMins_") || k.startsWith("focusSessions_") || k.startsWith("studyStatus_") || k.startsWith("focusDur_")){
             localStorage.setItem(k, String(d.focusMins[k]||"0"));
           }
         });
       }

       if(d.pomoMinutes!==undefined) localStorage.setItem("pomoMinutes", String(d.pomoMinutes||"25"));
       if(d.lastCalendarCheck!==undefined) localStorage.setItem("lastCalendarCheck", String(d.lastCalendarCheck||""));

       alert("Backup imported. Reloading…");
       window.location.reload();
     }catch(e){
       alert("Import failed. Please choose a valid The Grind backup JSON.");
     }
   };
   reader.readAsText(file);
 }

 

 const bgClass = "bg-black text-white";

 return (

 <div className={`min-h-screen p-6 ${bgClass}`}>
 <div className="mb-6">
 <div className="flex flex-col gap-2">
 <h1 className="text-3xl font-bold">The Grind</h1>
</div>
 <p className="text-sm text-gray-400 mt-1">"Pride in the work" • "Stand tall like the sun at noon"</p>
 <p className="text-xs text-gray-500">Vegeta mindset × Escanor confidence</p>
 </div>

 <Tabs value={tab} onValueChange={setTab}>
 <TabsList className="flex gap-2 mb-6">
 <TabsTrigger value="dashboard">CONTROL ROOM</TabsTrigger>
 <TabsTrigger value="timetable">Timetable</TabsTrigger>
 <TabsTrigger value="tasks">Backlog</TabsTrigger>
 <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
 <TabsTrigger value="notes">Notes</TabsTrigger>
 <TabsTrigger value="calendar">Calendar</TabsTrigger>
 <TabsTrigger value="resources">Resources</TabsTrigger>
 <TabsTrigger value="tests">Tests</TabsTrigger>
 <TabsTrigger value="revision">Revision</TabsTrigger>
 <TabsTrigger value="backup">Backup</TabsTrigger>
 </TabsList>

 <TabsContent value="dashboard"><Dashboard/></TabsContent>
 <TabsContent value="timetable"><Timetable/></TabsContent>
 <TabsContent value="tasks"><Tasks tasks={tasks} setTasks={setTasks}/></TabsContent>
 <TabsContent value="pomodoro"><Pomodoro/></TabsContent>
 <TabsContent value="notes"><Notes notes={notes} setNotes={setNotes}/></TabsContent>
 <TabsContent value="calendar"><CalendarView /></TabsContent>
 <TabsContent value="resources"><Resources resources={resources} setResources={setResources}/></TabsContent>
 <TabsContent value="tests"><Tests tests={tests} setTests={setTests}/></TabsContent>
 <TabsContent value="revision"><Revision topics={topics} setTopics={setTopics}/></TabsContent>
 <TabsContent value="backup"><Backup exportBackup={exportBackup} importBackupFile={importBackupFile} /></TabsContent>
 </Tabs>
 </div>
 );
}

function Dashboard(){
  // --- Pride Streak ---
  const [streak,setStreak]=useState(()=>{
    const saved = typeof window !== "undefined"
  ? localStorage.getItem("prideStreak")
  : null;

    return saved?parseInt(saved,10):0;
  });

  // --- Power Level (does NOT reset with streak) ---
  const [power,setPower]=useState(()=>{
    const saved = typeof window !== "undefined"
  ? localStorage.getItem("powerLevel")
  : null;
    return saved?parseInt(saved,10):0;
  });

  const [focus,setFocus]=useState(()=>{
   return typeof window !== "undefined"
  ? localStorage.getItem("todayFocus") || "Train like Vegeta. Stand proud like Escanor. Every session is a step closer to dominance in JEE."
  : "Train like Vegeta. Stand proud like Escanor. Every session is a step closer to dominance in JEE.";
  });

  // --- Anti-cheat: require MINUTES before you can claim the day ---
  // Normal day: >= 125 min → +100 power
  // Elite day:  >= 250 min → +200 power
  const REQUIRED_MINS = 125;
  const ELITE_MINS = 250;
  const today = dayKey();
  const sessionsToday = parseInt(localStorage.getItem(keySessions(today)) || "0", 10);
  const minsToday = parseInt(localStorage.getItem(keyMins(today)) || "0", 10);

  const lastDone = localStorage.getItem("lastStudyDay") || ""; // YYYY-MM-DD
  const doneToday = lastDone === today;

  // --- Auto-close days you forgot to claim ---
  const [autoMsg,setAutoMsg]=useState("");

  useEffect(()=>{
    const lastCheck = localStorage.getItem("lastCalendarCheck") || today;
    const gap = daysBetween(lastCheck, today);

    let powerCur = parseInt(localStorage.getItem("powerLevel") || "0", 10);
    let streakCur = parseInt(localStorage.getItem("prideStreak") || "0", 10);
    let lastStudyDayCur = localStorage.getItem("lastStudyDay") || "";

    let autoDone = 0;

    for(let i=1;i<=gap;i++){
      const d = addDays(lastCheck, i);
      if(d === today) break;

      const statusK = keyStatus(d);
      const existing = localStorage.getItem(statusK) || "";
      if(existing === "done") continue;

      const mins = parseInt(localStorage.getItem(keyMins(d)) || "0", 10);

      if(mins >= REQUIRED_MINS){
        localStorage.setItem(statusK, "done");
        autoDone++;

        if(lastStudyDayCur && daysBetween(lastStudyDayCur, d) === 1){
          streakCur = streakCur + 1;
        } else {
          streakCur = 1;
        }
        lastStudyDayCur = d;

        const gain = mins >= ELITE_MINS ? 200 : 100;
        powerCur = powerCur + gain;
      } else {
        localStorage.setItem(statusK, "missed");
      }
    }

    localStorage.setItem("powerLevel", String(powerCur));
    localStorage.setItem("prideStreak", String(streakCur));
    localStorage.setItem("lastStudyDay", String(lastStudyDayCur));

    setPower(powerCur);
    setStreak(streakCur);

    if(autoDone > 0){
      setAutoMsg(`⚡ Auto‑claimed ${autoDone} previous study day${autoDone>1?'s':''}.`);
    }

    localStorage.setItem("lastCalendarCheck", today);
  },[]);

  // --- Streak break penalty: -200 power when streak breaks (once per break) ---
  useEffect(()=>{
    const last=localStorage.getItem("lastStudyDay") || "";
    if(!last) return;
    const gap = daysBetween(last, today);
    if(gap > 1){
      const lastPenaltyDay = localStorage.getItem("lastPenaltyDay") || "";
      if(lastPenaltyDay !== today){
        const currentPower = parseInt(localStorage.getItem("powerLevel") || "0", 10);
        const newPower = Math.max(0, currentPower - 200);
        localStorage.setItem("powerLevel", String(newPower));
        setPower(newPower);

        localStorage.setItem("prideStreak", "0");
        setStreak(0);

        localStorage.setItem("lastPenaltyDay", today);
      }
    }
  },[]);

  const hour=new Date().getHours();
  // Escanor mode moved to evening since user is in class at noon
  const noonMode=hour>=18 && hour<=22;

  function saveFocus(){
    localStorage.setItem("todayFocus", focus);
  }

  function completeStudyDay(){
    if(doneToday) return;
    if(minsToday < REQUIRED_MINS){
      alert(`Not enough study time yet. Do at least ${REQUIRED_MINS} minutes first.`);
      return;
    }

    const prevDay = localStorage.getItem("lastStudyDay") || "";
    const gap = prevDay ? daysBetween(prevDay, today) : 0;

    let newStreak = 1;
    if(prevDay && gap === 1){
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    const eliteDay = minsToday >= ELITE_MINS;
    const powerGain = eliteDay ? 200 : 100;
    const newPower = power + powerGain;

    setStreak(newStreak);
    setPower(newPower);

    localStorage.setItem("prideStreak", String(newStreak));
    localStorage.setItem("powerLevel", String(newPower));
    localStorage.setItem("lastStudyDay", today);

    // mark calendar
    localStorage.setItem(keyStatus(today), "done");
  }

  // --- Next exam system ---
  const [examDate,setExamDate]=useState(()=>localStorage.getItem("nextExamDate")||"");
  const [examSaved,setExamSaved]=useState(()=>!!localStorage.getItem("nextExamDate"));
  const [goalMarks,setGoalMarks]=useState(()=>localStorage.getItem("goalMarks")||"");

  function saveExam(){
    if(!examDate){
      alert("Please enter an exam date in YYYY-MM-DD format.");
      return;
    }
    localStorage.setItem("nextExamDate", examDate);
    localStorage.setItem("goalMarks", goalMarks);
    setExamSaved(true);
  }

  function getCountdown(dateStr){
    if(!dateStr) return "Not set";
    const diff=new Date(dateStr+"T00:00:00")-new Date();
    const days=Math.ceil(diff/(1000*60*60*24));
    return days>0?days+" days":"Exam passed";
  }

  const examCountdown=getCountdown(examDate);

  const jee2027Date=new Date("2027-01-20T00:00:00");
  const jeeDays=Math.ceil((jee2027Date-new Date())/(1000*60*60*24));

  return (
    <div className="space-y-4">

      <Card className={noonMode?"border-yellow-400 shadow-yellow-400/40 shadow-lg":""}>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold">Today's Focus</h2>
          <Textarea
            value={focus}
            onChange={(e)=>setFocus(e.target.value)}
            className="mt-3 bg-black border-gray-700 text-yellow-200 placeholder-gray-500"
          />
          <Button className="mt-3" onClick={saveFocus}>Save Focus</Button>
        </CardContent>
      </Card>

      {autoMsg && (
      <Card className="border-green-700 bg-green-900/20">
        <CardContent className="p-3 text-green-300 text-sm font-medium">{autoMsg}</CardContent>
      </Card>
      )}

      <Card>
        <CardContent className="p-6 flex justify-between items-center">
          <div>
            <h3 className="font-semibold">🔥 Pride Streak</h3>
            <p className="text-2xl mt-1">{streak} days</p>
            <p className="text-sm text-gray-400 mt-1">Minutes today: <b className="text-white">{minsToday}</b> / {REQUIRED_MINS} min</p>
            <p className="text-sm text-gray-500">Sessions today: <b className="text-white">{sessionsToday}</b></p>
          </div>
          <Button
            onClick={completeStudyDay}
            disabled={doneToday || minsToday < REQUIRED_MINS}
            className={doneToday ? "opacity-60" : ""}
          >
            {doneToday ? "Done for Today ✓" : "Complete Study Day"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">⚡ Power Level</h3>
          <p className="text-2xl mt-1">{power}</p>
          <p className="text-sm text-gray-400">+100 for each real study day (≥125 min). Elite Training Day (≥250 min) → +200 power. If streak breaks → Power -200 (but power never resets).</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold">📅 Next Exam</h3>
          <Input className={INPUT_CLS} placeholder="YYYY-MM-DD" value={examDate} onChange={e=>setExamDate(e.target.value)}/>
          <Input className={INPUT_CLS} placeholder="Goal Marks" value={goalMarks} onChange={e=>setGoalMarks(e.target.value)}/>

          {!examSaved ? (
            <Button onClick={saveExam}>Save Exam</Button>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-green-400 text-sm">Exam Saved ✓</p>
              <Button
                variant="outline"
                className={OUTLINE_BTN_CLS}
                onClick={()=>{
                  localStorage.removeItem("nextExamDate");
                  localStorage.removeItem("goalMarks");
                  setExamDate("");
                  setGoalMarks("");
                  setExamSaved(false);
                }}
              >
                Change Exam
              </Button>
            </div>
          )}

          <p className="text-sm text-gray-400">Countdown: {examCountdown}</p>
          <p className="text-sm text-gray-400">Goal: {goalMarks || "Not set"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold">🎯 JEE Mains 2027 Countdown</h3>
          <p className="text-2xl mt-1">{jeeDays} days left</p>
        </CardContent>
      </Card>

      <Card className={noonMode ? "bg-yellow-700/40 border-yellow-300" : "bg-gray-900 border-gray-700"}>
        <CardContent className="p-6">
          <h3 className="font-semibold">☀ Escanor Mode</h3>
          <p className="mt-2 text-sm">
            Escanor Mode window: <span className="text-yellow-300 font-semibold">18:00 – 22:00</span>
          </p>
          {noonMode ? (
            <p className="text-yellow-300 font-bold mt-3">☀ ESCANOR MODE ACTIVE — Golden Focus Window.</p>
          ) : (
            <p className="text-gray-300 mt-3">Escanor Mode is currently inactive. It will automatically activate during the evening window.</p>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

function Timetable(){
 const [sessions,setSessions]=useState([]);
 const [title,setTitle]=useState("");

 return (
 <div className="space-y-4">
 <Input className={INPUT_CLS} placeholder="Study session" value={title} onChange={e=>setTitle(e.target.value)}/>
 <Button onClick={()=>{setSessions([...sessions,{id:uid(),title}]);setTitle("");}}>Add Session</Button>
 {sessions.map(s=>(
 <Card key={s.id}><CardContent className="p-3">{s.title}</CardContent></Card>
 ))}
 </div>
 );
}

function Tasks({tasks,setTasks}){
 const [task,setTask]=useState("");
 return (
 <div className="space-y-4">
 <Input className={INPUT_CLS} placeholder="Add task" value={task} onChange={e=>setTask(e.target.value)}/>
 <Button onClick={()=>{setTasks([...tasks,{id:uid(),task}]);setTask("");}}>Add</Button>
 {tasks.map(t=>(
 <Card key={t.id}>
 <CardContent className="flex justify-between p-3">{t.task}
 <Button onClick={()=>setTasks(tasks.filter(x=>x.id!==t.id))}><Trash2 size={16}/></Button>
 </CardContent>
 </Card>
 ))}
 </div>
 );
}

function Pomodoro(){
 const [minutesPerSession,setMinutesPerSession]=useState(()=>{
   const saved = localStorage.getItem("pomoMinutes");
   return saved ? Math.max(5, parseInt(saved,10) || 25) : 25;
 });
 const [time,setTime]=useState(()=>minutesPerSession*60);
 const [running,setRunning]=useState(false);
 const [sessions,setSessions]=useState(0);

 // When duration changes, reset the remaining time (only if not running)
 useEffect(()=>{
   if(running) return;
   setTime(minutesPerSession*60);
 },[minutesPerSession, running]);

 useEffect(()=>{
   if(!running) return;
   const timer=setInterval(()=>{
     setTime(t=>{
       if(t<=1){
         setRunning(false);
         setSessions(s=>s+1);

         const d = dayKey();
         const prevM = parseInt(localStorage.getItem(keyMins(d)) || "0", 10);
         const prevS = parseInt(localStorage.getItem(keySessions(d)) || "0", 10);
         localStorage.setItem(keyMins(d), String(prevM + minutesPerSession));
         localStorage.setItem(keySessions(d), String(prevS + 1));

         // bucket counts by common durations (25/45/60/90) + any custom duration
         const durKey = keyDur(d, minutesPerSession);
         const prevDur = parseInt(localStorage.getItem(durKey) || "0", 10);
         localStorage.setItem(durKey, String(prevDur + 1));

         return minutesPerSession*60;
       }
       return t-1;
     });
   },1000);
   return ()=>clearInterval(timer);
 },[running, minutesPerSession]);

 const minutes=Math.floor(time/60);
 const seconds=time%60;
 const finalForm=sessions>=3;
 const d = dayKey();
 const focusMinsToday = parseInt(localStorage.getItem(keyMins(d)) || "0", 10);
 const focusSessionsToday = parseInt(localStorage.getItem(keySessions(d)) || "0", 10);

 function applyPreset(m){
   setRunning(false);
   setMinutesPerSession(m);
   localStorage.setItem("pomoMinutes", String(m));
 }

 return (
 <div className="flex flex-col items-center space-y-6">

 <div className="w-56 h-56 rounded-full border-4 border-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
 <span className="text-5xl font-bold">
 {minutes}:{seconds.toString().padStart(2,"0")}
 </span>
 </div>

 <div className="w-full max-w-xl">
   <Card>
     <CardContent className="p-4 space-y-3">
       <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
         <div className="w-full sm:w-64">
           <p className="text-sm text-gray-400">Session length (minutes)</p>
           <Input
             className={INPUT_CLS}
             type="number"
             min={5}
             max={180}
             value={minutesPerSession}
             onChange={(e)=>{
               const raw = parseInt(e.target.value || "25", 10);
               const v = Math.max(5, Math.min(180, isNaN(raw)?25:raw));
               setMinutesPerSession(v);
               localStorage.setItem("pomoMinutes", String(v));
             }}
           />
         </div>
         <div className="flex gap-2 flex-wrap">
           <Button variant="secondary" onClick={()=>applyPreset(25)}>25</Button>
           <Button variant="secondary" onClick={()=>applyPreset(45)}>45</Button>
           <Button variant="secondary" onClick={()=>applyPreset(60)}>60</Button>
           <Button variant="secondary" onClick={()=>applyPreset(90)}>90</Button>
         </div>
       </div>
     </CardContent>
   </Card>
 </div>

 <div className="flex gap-3">
 <Button onClick={()=>setRunning(!running)}>
 {running ? "Pause" : "Start"}
 </Button>

 <Button
 variant="outline"
 className={OUTLINE_BTN_CLS}
 onClick={()=>{
 setRunning(false);
 setTime(minutesPerSession*60);
 }}
 >
 Reset
 </Button>
 </div>

 <p className="text-sm text-gray-400">Completed Focus Sessions (this timer): {sessions}</p>
 <p className="text-sm text-gray-400">Logged today: <b className="text-white">{focusSessionsToday} sessions</b> • <b className="text-white">{focusMinsToday} min</b></p>

 {finalForm && (
 <div className="p-3 border border-purple-500 text-purple-400 rounded-lg">
 ⚡ Final Form Focus Activated — Vegeta level discipline unlocked.
 </div>
 )}

 </div>
 );
}

function Notes({notes,setNotes}){
 const [text,setText]=useState("");
 return (
 <div className="space-y-4">
 <Textarea className={TEXTAREA_CLS} placeholder="Write notes" value={text} onChange={e=>setText(e.target.value)}/>
 <Button onClick={()=>{setNotes([...notes,{id:uid(),text}]);setText("");}}>Save Note</Button>
 {notes.map(n=>(
 <Card key={n.id}><CardContent className="p-3">{n.text}</CardContent></Card>
 ))}
 </div>
 );
}

function Resources({resources,setResources}){
 const [link,setLink]=useState("");
 return (
 <div className="space-y-4">
 <Input className={INPUT_CLS} placeholder="Paste practice link" value={link} onChange={e=>setLink(e.target.value)}/>
 <Button onClick={()=>{setResources([...resources,{id:uid(),link}]);setLink("");}}>Save Link</Button>
 {resources.map(r=>(
 <Card key={r.id}>
 <CardContent className="flex justify-between p-3">
 <a href={r.link} target="_blank">Practice Test</a>
 <LinkIcon size={16}/>
 </CardContent>
 </Card>
 ))}
 </div>
 );
}

function Tests({tests,setTests}){
 const [score,setScore]=useState("");
 return (
 <div className="space-y-4">
 <Input className={INPUT_CLS} placeholder="Test score" value={score} onChange={e=>setScore(e.target.value)}/>
 <Button onClick={()=>{setTests([...tests,{id:uid(),score}]);setScore("");}}>Save Score</Button>
 {tests.map(t=>(
 <Card key={t.id}><CardContent className="p-3">Score: {t.score}</CardContent></Card>
 ))}
 </div>
 );
}

function Revision({topics,setTopics}){
 const [topic,setTopic]=useState("");
 return (
 <div className="space-y-4">
 <Input className={INPUT_CLS} placeholder="Topic for revision" value={topic} onChange={e=>setTopic(e.target.value)}/>
 <Button onClick={()=>{setTopics([...topics,{id:uid(),topic}]);setTopic("");}}>Add Topic</Button>
 {topics.map(t=>(
 <Card key={t.id}><CardContent className="p-3">{t.topic}</CardContent></Card>
 ))}
 </div>
 );
}

function CalendarView(){
  const DURATIONS = [25,45,60,90];
  const [ym,setYm]=useState(()=>ymFromDate(new Date()));
  const [selected,setSelected]=useState(()=>dayKey());

  const today = dayKey();

  // build month grid
  const grid = useMemo(()=>{
    const start = monthStart(ym);
    const dim = daysInMonth(ym);
    const firstDow = start.getDay(); // 0 Sun

    const cells = [];
    // pad before
    for(let i=0;i<firstDow;i++) cells.push(null);
    for(let day=1; day<=dim; day++){
      const d = new Date(start.getFullYear(), start.getMonth(), day);
      cells.push(dayKey(d));
    }
    // pad after to complete weeks
    while(cells.length % 7 !== 0) cells.push(null);
    return cells;
  },[ym]);

  const selMins = parseInt(localStorage.getItem(keyMins(selected)) || "0", 10);
  const selSessions = parseInt(localStorage.getItem(keySessions(selected)) || "0", 10);
  const selStatus = localStorage.getItem(keyStatus(selected)) || "";

  // monthly totals (for current calendar month)
  const monthTotals = useMemo(()=>{
    const start = monthStart(ym);
    const dim = daysInMonth(ym);
    let totalMins = 0;
    let totalSessions = 0;
    const byDur = Object.fromEntries(DURATIONS.map(d=>[d,0]));

    for(let day=1; day<=dim; day++){
      const dateStr = dayKey(new Date(start.getFullYear(), start.getMonth(), day));
      totalMins += parseInt(localStorage.getItem(keyMins(dateStr)) || "0", 10);
      totalSessions += parseInt(localStorage.getItem(keySessions(dateStr)) || "0", 10);
      DURATIONS.forEach(dur=>{
        byDur[dur] += parseInt(localStorage.getItem(keyDur(dateStr, dur)) || "0", 10);
      });
    }

    return { totalMins, totalSessions, byDur };
  },[ym]);

  function prevMonth(){
    const d = monthStart(ym);
    d.setMonth(d.getMonth()-1);
    setYm(ymFromDate(d));
  }

  function nextMonth(){
    const d = monthStart(ym);
    d.setMonth(d.getMonth()+1);
    setYm(ymFromDate(d));
  }

  function statusBadge(dateStr){
    if(!dateStr) return "";
    const status = localStorage.getItem(keyStatus(dateStr)) || "";
    const mins = parseInt(localStorage.getItem(keyMins(dateStr)) || "0", 10);

    // Future days
    if(dateStr > today) return "bg-gray-900 border-gray-800 text-gray-500";

    if(status === "done") return "bg-green-900/30 border-green-700 text-green-300";
    if(status === "missed") return "bg-red-900/30 border-red-700 text-red-300";

    // not marked yet: show neutral but if there was study time, show yellow-ish
    if(mins > 0) return "bg-yellow-900/20 border-yellow-700 text-yellow-200";
    return "bg-gray-900 border-gray-700 text-gray-300";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              className={`${OUTLINE_BTN_CLS} w-10 h-10 p-0 flex items-center justify-center shadow-sm shadow-white/10`}
              onClick={prevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </Button>
            <div className="text-lg font-semibold">{ym}</div>
            <Button
              variant="outline"
              className={`${OUTLINE_BTN_CLS} w-10 h-10 p-0 flex items-center justify-center shadow-sm shadow-white/10`}
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2 text-xs text-gray-400">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d)=> (
              <div key={d} className="text-center">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {grid.map((dateStr, idx)=>{
              if(!dateStr) return <div key={idx} className="h-10" />;
              const isSel = dateStr === selected;
              const cls = statusBadge(dateStr);
              const mins = parseInt(localStorage.getItem(keyMins(dateStr)) || "0", 10);
              return (
                <button
                  key={dateStr}
                  onClick={()=>setSelected(dateStr)}
                  className={`h-10 rounded-md border px-2 flex items-center justify-between ${cls} ${isSel?"ring-2 ring-white/40":""}`}
                >
                  <span className="text-sm font-semibold">{parseInt(dateStr.slice(-2),10)}</span>
                  <span className="text-[10px] opacity-80">{mins>0?`${mins}m`:''}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm text-gray-400">Selected day</div>
                <div className="text-lg font-semibold">{selected}</div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <div className="text-sm">Sessions: <b className="text-white">{selSessions}</b></div>
                <div className="text-sm">Minutes: <b className="text-white">{selMins}</b></div>
                <div className="text-sm">Status: <b className="text-white">{selStatus || (selected>today?"future":"unmarked")}</b></div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Colors: <span className="text-green-300">done</span> • <span className="text-red-300">missed</span> • <span className="text-yellow-200">studied but not claimed</span>.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-3">
          <h3 className="text-lg font-semibold">Monthly Totals</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>Total time: <b className="text-white">{monthTotals.totalMins} min</b></div>
            <div>Total sessions: <b className="text-white">{monthTotals.totalSessions}</b></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            {DURATIONS.map(dur=> (
              <div key={dur} className="rounded-md border border-gray-700 bg-gray-900 p-3">
                <div className="text-gray-400 text-xs">{dur} min sessions</div>
                <div className="text-lg font-semibold">{monthTotals.byDur[dur] || 0}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500">
            These counts are based on the session length you used when a Pomodoro ended.
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

function Backup({ exportBackup, importBackupFile }){
  const fileRef = useRef(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6 space-y-3">
          <h2 className="text-xl font-semibold">Backup & Restore</h2>
          <p className="text-sm text-gray-400">
            Export saves everything to a JSON file on your laptop. Import restores it back.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={exportBackup}>Export Backup</Button>
            <Button variant="outline" className={OUTLINE_BTN_CLS} onClick={()=>fileRef.current?.click()}>Import Backup</Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e)=>{
                const f=e.target.files?.[0];
                if(f) importBackupFile(f);
                e.target.value="";
              }}
            />
          </div>

          <div className="text-xs text-gray-500">
            Tip: Export once every week and store the file in Google Drive / pendrive.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}