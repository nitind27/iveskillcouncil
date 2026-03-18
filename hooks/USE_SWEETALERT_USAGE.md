# useSweetAlert Hook - Usage Guide

यह एक reusable hook है जो SweetAlert2 को आसानी से use करने के लिए बनाया गया है। इस hook को किसी भी component में use कर सकते हैं।

## Installation

Hook already installed है। बस import करें:

```typescript
import { useSweetAlert } from '@/hooks/useSweetAlert';
```

## Basic Usage

### 1. Component में Hook Import करें

```typescript
"use client";

import { useSweetAlert } from '@/hooks/useSweetAlert';

export default function MyComponent() {
  const { showSuccess, showError } = useSweetAlert();
  
  // ... rest of your code
}
```

### 2. Success Message दिखाएं

```typescript
const handleSuccess = async () => {
  await showSuccess('Success!', 'Operation completed successfully.');
};
```

### 3. Error Message दिखाएं

```typescript
const handleError = async () => {
  await showError('Error!', 'Something went wrong. Please try again.');
};
```

## Complete Example - Login Page

```typescript
"use client";

import { useState } from 'react';
import { useSweetAlert } from '@/hooks/useSweetAlert';

export default function LoginPage() {
  const { showSuccess, showError } = useSweetAlert();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response.ok) {
        // Success case
        await showSuccess(
          'Login Successful!',
          'Redirecting to dashboard...',
          {
            timer: 2000,
            showConfirmButton: false,
          }
        );
        // Redirect after success
        window.location.href = '/dashboard';
      } else {
        // Error case
        await showError(
          'Login Failed',
          'Invalid email or password. Please try again.'
        );
      }
    } catch (error) {
      // Error case
      await showError(
        'Error',
        'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // ... your form JSX
  );
}
```

## Available Functions

### showSuccess
Success message दिखाता है।

```typescript
await showSuccess('Title', 'Message', {
  timer: 2000,
  showConfirmButton: false,
});
```

### showError
Error message दिखाता है।

```typescript
await showError('Title', 'Message', {
  confirmButtonText: 'OK',
});
```

### showWarning
Warning message दिखाता है।

```typescript
await showWarning('Warning!', 'Please check your input.');
```

### showInfo
Information message दिखाता है।

```typescript
await showInfo('Info', 'This is an informational message.');
```

### showConfirm
Confirmation dialog दिखाता है।

```typescript
const result = await showConfirm(
  'Are you sure?',
  'Do you want to proceed?'
);

if (result.isConfirmed) {
  // User clicked "Yes"
  console.log('User confirmed');
} else {
  // User clicked "No" or closed
  console.log('User cancelled');
}
```

### showDeleteConfirm
Delete confirmation dialog दिखाता है।

```typescript
const result = await showDeleteConfirm(
  'Delete Item?',
  'This action cannot be undone!'
);

if (result.isConfirmed) {
  // Delete the item
  await deleteItem();
  await showSuccess('Deleted!', 'Item deleted successfully.');
}
```

### showToast
Toast notification दिखाता है (non-blocking)।

```typescript
await showToast('success', 'Operation completed!');
await showToast('error', 'Something went wrong!');
await showToast('warning', 'Please check your input.');
await showToast('info', 'New message received');
```

## Advanced Options

आप custom options भी pass कर सकते हैं:

```typescript
await showSuccess('Success!', 'Message', {
  timer: 3000,
  showConfirmButton: false,
  position: 'top-end',
  customClass: {
    popup: 'my-custom-popup',
  },
});
```

## Real-World Examples

### Example 1: Form Submission

```typescript
const handleSubmit = async (formData: FormData) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      await showSuccess('Form Submitted!', 'Your form has been submitted successfully.');
    } else {
      const error = await response.json();
      await showError('Submission Failed', error.message || 'Please try again.');
    }
  } catch (error) {
    await showError('Error', 'An unexpected error occurred.');
  }
};
```

### Example 2: Delete Operation

```typescript
const handleDelete = async (id: string) => {
  const result = await showDeleteConfirm(
    'Delete Item?',
    'This action cannot be undone!'
  );
  
  if (result.isConfirmed) {
    try {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      await showSuccess('Deleted!', 'Item deleted successfully.');
      // Refresh list
      fetchItems();
    } catch (error) {
      await showError('Error', 'Failed to delete item.');
    }
  }
};
```

### Example 3: API Call with Loading

```typescript
const handleApiCall = async () => {
  try {
    // Show loading (optional)
    const loadingPromise = showLoading('Processing...', 'Please wait');
    
    const response = await fetch('/api/data');
    const data = await response.json();
    
    // Close loading
    closeAlert();
    
    if (response.ok) {
      await showSuccess('Success!', 'Data loaded successfully.');
    } else {
      await showError('Error', data.message || 'Failed to load data.');
    }
  } catch (error) {
    await showError('Error', 'An unexpected error occurred.');
  }
};
```

## Benefits

1. **Reusable** - एक बार बनाएं, हर जगह use करें
2. **Type-Safe** - TypeScript support के साथ
3. **Easy to Use** - Simple API
4. **Consistent** - सभी components में same look और feel
5. **Flexible** - Custom options pass कर सकते हैं

## Notes

- सभी functions `async/await` support करते हैं
- हमेशा `await` use करें promises के लिए
- Error handling के लिए `try/catch` use करें
- Success/Error messages clear और specific रखें

