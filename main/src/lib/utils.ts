// Utility Functions

/**
 * Combine class names conditionally
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calculate personality type from answers
 */
export function calculatePersonalityType(answers: Record<string, string>): {
  type: string;
  juz: number;
  scores: Record<string, number>;
} {
  const scores: Record<string, number> = {};

  // Count occurrences of each letter
  Object.values(answers).forEach((value) => {
    scores[value] = (scores[value] || 0) + 1;
  });

  // Get top 4 traits (similar to MBTI)
  const sortedTraits = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4)
    .map(([trait]) => trait);

  const personalityType = sortedTraits.join("");

  // Map personality type to Juz (example mapping)
  const juzMapping: Record<string, number> = {
    // You'll need to define this based on your quiz logic
    EHNL: 1,
    IHSL: 2,
    // Add more mappings...
  };

  return {
    type: personalityType,
    juz: juzMapping[personalityType] || 1,
    scores,
  };
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: unknown): {
  error: string;
  status: number;
} {
  console.error("API Error:", error);

  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500,
    };
  }

  return {
    error: "An unexpected error occurred",
    status: 500,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter",
    };
  }
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one number",
    };
  }

  return { valid: true };
}
