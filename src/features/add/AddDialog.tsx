import { Dialog, DialogContent } from '@/components/ui/dialog'
import { AddPage } from './Add'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Wrapper modal pour creer une degustation depuis n'importe quelle page du
// desktop sans quitter le contexte courant. Reutilise AddPage en lui passant
// onComplete qui ferme le dialog au lieu de naviguer vers /feed.
//
// Sur mobile, on garde la route /add (fullscreen) — cf AppLayout pour le
// branchement responsive.
export function AddDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-12">
          <AddPage onComplete={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
