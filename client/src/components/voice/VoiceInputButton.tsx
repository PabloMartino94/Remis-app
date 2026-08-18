import { useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpeechCapture } from '@/hooks/use-speech-capture';
import { toast } from 'sonner';

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  className?: string;
}

export function VoiceInputButton({ onTranscript, disabled, className }: VoiceInputButtonProps) {
  const { transcript, isListening, error, isSupported, start, stop } = useSpeechCapture();

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <Button
      type="button"
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      className={className}
      data-testid="button-voice-input"
      title={isListening ? "Detener grabación" : "Agregar por voz"}
    >
      {isListening ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
}
