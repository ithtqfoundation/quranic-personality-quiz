"use client";

import React from "react";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";

export default function RestartTest() {
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleClick() {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      // Delete ALL quiz results from database (both completed and in-progress)
      const response = await fetch('/api/quiz/restart', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to delete quiz:', errorText);
        alert('Gagal menghapus data quiz. Silakan coba lagi.');
        setIsDeleting(false);
        return;
      }

      const result = await response.json();
      console.log('✅ Quiz deleted:', result);

      // Clear localStorage
      localStorage.removeItem("lastResultPayload");
      localStorage.removeItem("htq-answers");
      localStorage.removeItem("quizResultId");
      localStorage.removeItem("anonUserId");
      localStorage.removeItem("branchCategory");
      localStorage.removeItem("lastTieBreakerQuestions");
      localStorage.removeItem("lastTieBreakerParams");

      // Small delay to ensure DB transaction is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect to test page
      window.location.href = "/test/1";
    } catch (error) {
      console.error('Restart error:', error);
      alert('Terjadi kesalahan. Silakan refresh halaman dan coba lagi.');
      setIsDeleting(false);
    }
  }
  
  return (
    <Button
      onClick={handleClick}
      disabled={isDeleting}
      className="shadow-xs bg-neutral-100 text-neutral-900 font-bold text-[14px] !px-3.5 py-2 hover:scale-105 rounded-[8px] disabled:opacity-50"
    >
      <RefreshCcw />
      <p>{isDeleting ? 'Menghapus...' : 'Ulangi Test'}</p>
    </Button>
  );
}
