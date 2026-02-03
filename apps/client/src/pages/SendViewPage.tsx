import { decryptNote, deriveKey, hashTitle } from '@otterseal/core';
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Flame,
  Mail,
  MailOpen,
  Send,
  Share2,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Layout from '../components/Layout';

interface SecretMetadata {
  expiresAt: number | null;
  burnAfterReading: boolean;
}

export default function SendViewPage() {
  const { uuid } = useParams();
  const location = useLocation();
  const isCreator = location.state?.created === true;

  const [status, setStatus] = useState('loading');
  const [metadata, setMetadata] = useState<SecretMetadata | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const title = `/send/${uuid}`;
  const shareUrl = `${window.location.origin}/send/${uuid}`;

  useEffect(() => {
    async function loadMetadata() {
      try {
        const id = await hashTitle(title);
        const response = await fetch(`/api/notes/${id}?peek=1`);

        if (response.status === 404) {
          setStatus('notfound');
          return;
        }
        if (response.status === 410) {
          setStatus('expired');
          return;
        }
        if (!response.ok) {
          setStatus('error');
          return;
        }

        const data = await response.json();
        setMetadata(data);
        setStatus('ready');
      } catch (e) {
        console.error('Load error:', e);
        setStatus('error');
      }
    }

    loadMetadata();
  }, [title]);

  const handleOpen = async () => {
    try {
      const id = await hashTitle(title);
      const key = await deriveKey(title);
      const response = await fetch(`/api/notes/${id}`);

      if (response.status === 404) {
        setStatus('notfound');
        return;
      }
      if (response.status === 410) {
        setStatus('expired');
        return;
      }
      if (!response.ok) {
        setStatus('error');
        return;
      }

      const data = await response.json();
      const decrypted = await decryptNote(data.content, key);

      setContent(decrypted);
      setStatus('opened');
    } catch (e) {
      console.error('Open error:', e);
      setStatus('error');
    }
  };

  const handleCopyContent = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'OtterSeal Secret',
          text: 'I sent you a secure, encrypted message on OtterSeal. It self-destructs after reading! 🤫',
          url: shareUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      await handleCopyLink();
    }
  };

  const formatExpiry = (timestamp: number | null) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <Layout centerContent maxWidth="max-w-lg">
      <div className="w-full relative">
        {status === 'loading' && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center animate-pulse">
              <Mail className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
              <Mail className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              You have a secret message
            </h2>

            <div className="space-y-2 mb-6">
              {metadata?.expiresAt && (
                <p className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  Expires: {formatExpiry(metadata.expiresAt)}
                </p>
              )}
              {metadata?.burnAfterReading && (
                <p className="flex items-center justify-center gap-2 text-sm text-red-500 dark:text-red-400 font-medium">
                  <Flame className="w-4 h-4" />
                  This message will be deleted after you open it
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl transition-colors"
            >
              <MailOpen className="w-5 h-5" />
              Open Message
            </button>
          </div>
        )}

        {status === 'opened' && (
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-center gap-2 text-primary mb-4">
              <MailOpen className="w-8 h-8" />
            </div>

            <div className="relative">
              <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl min-h-[150px] whitespace-pre-wrap break-words text-gray-800 dark:text-gray-200">
                {content}
              </div>
              <button
                type="button"
                onClick={handleCopyContent}
                className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                )}
              </button>
            </div>

            <div className="text-center pt-4">
              <Link
                to="/send"
                className="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <Send className="w-4 h-4" />
                Create your own secret
              </Link>
            </div>
          </div>
        )}

        {(status === 'notfound' || status === 'expired') && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'notfound' ? 'Message not found' : 'Message has expired'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
              {status === 'notfound'
                ? "This link doesn't exist or has already been opened and deleted."
                : 'This message has passed its expiration date and is no longer available.'}
            </p>
            <Link
              to="/send"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
              Send a secret
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              We couldn't load the message. Please try again later.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-xl transition-colors"
            >
              Reload Page
            </button>
          </div>
        )}

        {isCreator && status === 'ready' && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-20">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 shadow-lg space-y-3">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-medium">
                <Check className="w-5 h-5" />
                Secret created! Share this link:
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg text-gray-700 dark:text-gray-300 truncate"
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  {linkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
                {typeof navigator.share === 'function' && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
