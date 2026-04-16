'use client'
import { useState } from "react";
import { json } from "stream/consumers";

export default function Planos() {
  const [recurrence, setRecurrence] = useState("monthly");

  const plans = [
    {
      id: 'pro',
      name: 'pro',
      price: 29,
    },
    {
      id: 'super',
      name: 'Pro',
      price: 120,
    }
  ]
  function handleToggle() {
    const next = recurrence === 'monthly' ? 'quarterly' : 'monthly';
    setRecurrence(next);
  }

  async function handleSelectPlan(plan: any) {
    const payload = {
      planId: plan.id,
      recurrence: recurrence,
    }
    console.log(payload);
    const response = await fetch('api/express/pay', {
      method: "POST",
      credentials: "include", 
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload),
    })

    const data = await response.json();
    console.log(data);
    window.location.href = data.url;
  }

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={handleToggle}
          style={{
            position: "relative",
            width: 44,
            height: 24,
            borderRadius: 12,
            background: "#3b82f6",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}>
          <div style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fff",
            transition: "transform 0.2s",
            transform: recurrence === 'monthly' ? 'translateX(20px)' : 'translateX(0px)',
          }} />
        </button>

          </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>

          {plans.map((plan) => (
            <div key={plan.id}>
              <h3>{plan.name}</h3>
              <button onClick={() => handleSelectPlan(plan)}>Assinar </button>
            </div>
          ))}
        </div>
    </>
  )
}