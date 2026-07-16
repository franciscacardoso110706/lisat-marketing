import { useQuery } from '@tanstack/react-query'
import { isImage, signedUrl } from './api'
import { Icon } from '@/components/ui/Icon'
import type { TaskAttachment } from '@/types/database'

/** Miniatura clicável de um anexo. Abre o ficheiro (URL assinado) num separador novo. */
export function AttachmentThumb({
  att,
  size = 64,
}: {
  att: TaskAttachment
  size?: number
}) {
  const { data: url } = useQuery({
    queryKey: ['signed', att.file_path],
    queryFn: () => signedUrl(att.file_path),
    staleTime: 50 * 60 * 1000,
  })

  const open = () => {
    if (url) window.open(url, '_blank', 'noopener')
  }

  return (
    <button
      onClick={open}
      title={att.file_name}
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 text-slate-400 transition hover:border-brand-300"
    >
      {isImage(att.mime_type) && url ? (
        <img src={url} alt={att.file_name} className="h-full w-full object-cover" />
      ) : (
        <Icon name="file" size={Math.round(size / 2.6)} />
      )}
    </button>
  )
}
