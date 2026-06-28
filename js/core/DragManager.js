export class DragManager {
    constructor() {
        this.zones = new Map();
        this.currentScene = 'floor';
    }

    setScene(sceneName) {
        this.currentScene = sceneName;
    }

    registerZone(id, element, { scene, accepts = [], onReceive }) {
        this.zones.set(id, { element, scene, accepts, onReceive });

        interact(element).dropzone({
            accept: '.draggable',
            overlap: 'center',
            ondrop: (event) => {
                const draggableEl   = event.relatedTarget;
                const draggedItemType = draggableEl.getAttribute('data-item-type');
                const draggedScene    = draggableEl.getAttribute('data-scene');

                if (this.currentScene !== scene || draggedScene !== scene) return;

                if (accepts.length > 0 && !accepts.includes(draggedItemType)) return;

                draggableEl.setAttribute('data-drop-valid', 'true');
                if (onReceive) onReceive(draggedItemType, draggableEl);
            }
        });
    }

    // dragPreviewSrc — optional URL; when provided a food-image ghost tracks the cursor
    registerDraggable(element, { itemType, scene, dragPreviewSrc = null }) {
        element.classList.add('draggable');
        element.setAttribute('data-item-type', itemType);
        element.setAttribute('data-scene', scene);

        let placeholder = null;
        let ghost       = null;

        interact(element).draggable({
            listeners: {
                start: (event) => {
                    if (scene !== this.currentScene) return;

                    // Semi-transparent placeholder so the source slot looks occupied
                    const startRect = element.getBoundingClientRect();
                    placeholder = element.cloneNode(true);
                    placeholder.style.cssText += `
                        position:absolute;
                        top:${startRect.top + window.scrollY}px;
                        left:${startRect.left + window.scrollX}px;
                        width:${startRect.width}px;
                        height:${startRect.height}px;
                        margin:0;opacity:0.4;z-index:1;pointer-events:none;
                    `;
                    document.body.appendChild(placeholder);

                    element.style.position    = 'relative';
                    element.style.zIndex      = '9999';
                    element.style.pointerEvents = 'none';

                    event.target.setAttribute('data-drag-x', 0);
                    event.target.setAttribute('data-drag-y', 0);
                    event.target.setAttribute('data-drop-valid', 'false');

                    // Food-image ghost that follows the cursor
                    if (dragPreviewSrc) {
                        element.style.opacity = '0'; // hide the real element

                        ghost = document.createElement('div');
                        ghost.style.cssText = `
                            position:fixed;
                            width:76px;height:76px;
                            border-radius:50%;
                            background:#fff;
                            border:3px solid rgba(255,255,255,0.9);
                            box-shadow:0 6px 20px rgba(0,0,0,0.45);
                            overflow:hidden;
                            pointer-events:none;
                            z-index:99999;
                            left:${event.clientX}px;
                            top:${event.clientY}px;
                            transform:translate(-50%,-55%) scale(1.08);
                        `;
                        ghost.innerHTML = `<img src="${dragPreviewSrc}" draggable="false"
                            style="width:100%;height:100%;object-fit:contain;display:block;" />`;
                        document.body.appendChild(ghost);
                    }
                },

                move: (event) => {
                    if (!placeholder || scene !== this.currentScene) return;

                    const x = (parseFloat(event.target.getAttribute('data-drag-x')) || 0) + event.dx;
                    const y = (parseFloat(event.target.getAttribute('data-drag-y')) || 0) + event.dy;

                    event.target.style.transform = `translate(${x}px, ${y}px)`;
                    event.target.setAttribute('data-drag-x', x);
                    event.target.setAttribute('data-drag-y', y);

                    if (ghost) {
                        ghost.style.left = `${event.clientX}px`;
                        ghost.style.top  = `${event.clientY}px`;
                    }
                },

                end: (event) => {
                    if (!placeholder) return;

                    const currentGhost       = ghost;
                    const currentPlaceholder = placeholder;
                    ghost       = null;
                    placeholder = null;

                    if (currentGhost) currentGhost.remove();
                    event.target.style.opacity = '';

                    const validDrop = event.target.getAttribute('data-drop-valid') === 'true';

                    if (!validDrop) {
                        event.target.style.transition = 'transform 0.3s ease';
                        event.target.style.transform  = 'translate(0px, 0px)';
                        setTimeout(() => {
                            if (event.target) {
                                event.target.style.transition    = '';
                                event.target.style.zIndex        = '';
                                event.target.style.position      = '';
                                event.target.style.pointerEvents = '';
                            }
                            currentPlaceholder?.parentNode?.removeChild(currentPlaceholder);
                        }, 300);
                    } else {
                        event.target.style.transform     = 'translate(0px, 0px)';
                        event.target.style.zIndex        = '';
                        event.target.style.position      = '';
                        event.target.style.pointerEvents = '';
                        currentPlaceholder?.parentNode?.removeChild(currentPlaceholder);
                    }
                }
            }
        });
    }
}
