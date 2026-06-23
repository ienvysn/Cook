export class Toast {
    static spawn(container, x, y, amount, detailText, variant) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${variant}`;
        
        let text = '';
        if (amount > 0) text += `+Rs.${amount} `;
        if (detailText) text += detailText;
        if (!text) {
            text = variant === 'perfect' ? 'Perfect!' : (variant === 'fail' ? 'Failed' : 'Partial');
        }
        
        toast.textContent = text.trim();
        
        toast.style.position = 'absolute';
        toast.style.left = `${x}px`;
        toast.style.top = `${y}px`;
        toast.style.transform = 'translate(-50%, -100%)';
        toast.style.fontWeight = 'bold';
        toast.style.fontSize = '14px';
        toast.style.padding = '4px 8px';
        toast.style.borderRadius = '4px';
        toast.style.pointerEvents = 'none';
        toast.style.whiteSpace = 'nowrap';
        toast.style.zIndex = '1000';
        toast.style.transition = 'all 2.5s ease-out';
        toast.style.opacity = '1';
        
        if (variant === 'perfect') {
            toast.style.color = '#2ecc71';
            toast.style.background = '#eafaf1';
            toast.style.border = '1px solid #2ecc71';
        } else if (variant === 'partial') {
            toast.style.color = '#f39c12';
            toast.style.background = '#fef5e7';
            toast.style.border = '1px solid #f39c12';
        } else {
            toast.style.color = '#e74c3c';
            toast.style.background = '#fdedec';
            toast.style.border = '1px solid #e74c3c';
        }
        
        container.appendChild(toast);
        
        // Trigger reflow
        toast.offsetHeight;
        
        toast.style.top = `${y - 80}px`;
        toast.style.opacity = '0';
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 2500);
    }
}
