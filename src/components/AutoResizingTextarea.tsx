import React, { useRef, useEffect } from 'react';
import type { TextareaHTMLAttributes } from 'react';

type AutoResizingTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

const AutoResizingTextarea: React.FC<AutoResizingTextareaProps> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reseta a altura para recalcular o scrollHeight corretamente
      textarea.style.height = 'auto';
      // Define a altura com base no conteúdo
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value]); // Reajusta sempre que o valor mudar

  return <textarea ref={textareaRef} {...props} />;
};

export default AutoResizingTextarea;
