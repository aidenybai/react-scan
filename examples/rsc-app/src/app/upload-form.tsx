'use client';
import { Suspense, lazy, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { saveData } from './action';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending}>{pending ? 'Submitting' : 'Submit'}</button>
  );
}

const ToggleScan = lazy(() => import('@/app/ToggleScan'));

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement | null>(null);

  async function formAction(formData: FormData) {
    await saveData(formData);
    formRef.current?.reset();
    alert('Save success!');
  }

  return (
    <>
      <form action={formAction} ref={formRef}>
        <h1>Upload Demo</h1>

        <div>Email</div>
        <input type="email" name="email" required />
        <br />
        <br />

        <div>Select file</div>
        <input type="file" name="file" required />
        <br />
        <br />
        <br />
        <Submit />
      </form>
      <Suspense>
        <ToggleScan />
      </Suspense>
    </>
  );
}
