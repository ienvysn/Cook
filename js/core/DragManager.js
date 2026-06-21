export class DragManager {
    constructor() {
        this.zones = new Map();
        this.currentScene = 'floor'; // Default scene
    }

    setScene(sceneName) {
        this.currentScene = sceneName;
    }

    registerZone(id, element, { scene, accepts = [], onReceive }) {
        this.zones.set(id, { element, scene, accepts, onReceive });

        interact(element).dropzone({
            accept: '.draggable',
            overlap: 'center', // 'center' ensures if the middle of the item is over the zone, it drops
            ondrop: (event) => {
                const draggableEl = event.relatedTarget;
                const dropzoneId = element.id || 'unknown-dropzone';
                console.log(`[Dropzone ${dropzoneId}] ondrop triggered by:`, draggableEl);
                const draggedItemType = draggableEl.getAttribute('data-item-type');
                const draggedScene = draggableEl.getAttribute('data-scene');
                
                // Scene scope check
                if (this.currentScene !== scene || draggedScene !== scene) {
                    return;
                }

                console.log(`[Dropzone ${dropzoneId}] Item dropped: ${draggedItemType}, accepts:`, accepts);
                
                // Match check
                // If accepts is empty, it accepts anything. If populated, it must include the type.
                if (accepts.length > 0 && !accepts.includes(draggedItemType)) {
                    console.log(`[Dropzone ${dropzoneId}] Rejected item type: ${draggedItemType}`);
                    return;
                }

                console.log(`[Dropzone ${dropzoneId}] Valid drop accepted!`);
                // Mark valid drop
                draggableEl.setAttribute('data-drop-valid', 'true');
                if (onReceive) {
                    onReceive(draggedItemType, draggableEl);
                }
            }
        });
    }

    registerDraggable(element, { itemType, scene }) {
        element.classList.add('draggable');
        element.setAttribute('data-item-type', itemType);
        element.setAttribute('data-scene', scene);

        let placeholder = null;

        interact(element).draggable({
            listeners: {
                start: (event) => {
                    console.log(`[Draggable ${itemType}] Drag started`, event.target);
                    if (scene !== this.currentScene) {
                        console.log(`[Draggable ${itemType}] Scene mismatch, ignoring`);
                        return;
                    }

                    // Create placeholder so it looks infinite, but attach to body so layout doesn't shift
                    const startRect = element.getBoundingClientRect();
                    placeholder = element.cloneNode(true);
                    placeholder.style.position = 'absolute';
                    placeholder.style.top = `${startRect.top}px`;
                    placeholder.style.left = `${startRect.left}px`;
                    placeholder.style.width = `${startRect.width}px`;
                    placeholder.style.height = `${startRect.height}px`;
                    placeholder.style.margin = '0';
                    placeholder.style.opacity = '0.5';
                    placeholder.style.zIndex = '1';
                    placeholder.style.pointerEvents = 'none';
                    document.body.appendChild(placeholder);

                    // Ensure element is above others while dragging and doesn't block pointer events for dropzones
                    element.style.position = 'relative';
                    element.style.zIndex = '9999';
                    element.style.pointerEvents = 'none';

                    // Reset drag state
                    event.target.setAttribute('data-drag-x', 0);
                    event.target.setAttribute('data-drag-y', 0);
                    event.target.setAttribute('data-drop-valid', 'false');
                },
                move: (event) => {
                    if (!placeholder || scene !== this.currentScene) return;

                    const x = (parseFloat(event.target.getAttribute('data-drag-x')) || 0) + event.dx;
                    const y = (parseFloat(event.target.getAttribute('data-drag-y')) || 0) + event.dy;

                    event.target.style.transform = `translate(${x}px, ${y}px)`;

                    event.target.setAttribute('data-drag-x', x);
                    event.target.setAttribute('data-drag-y', y);
                },
                end: (event) => {
                    console.log(`[Draggable] Drag ended`, event.target);
                    if (!placeholder) return;

                    const currentPlaceholder = placeholder;
                    placeholder = null; // Clear outer scope reference early for next drag

                    const validDrop = event.target.getAttribute('data-drop-valid') === 'true';
                    console.log(`[Draggable] validDrop result:`, validDrop);

                    if (!validDrop) {
                        // Snap back smoothly
                        event.target.style.transition = 'transform 0.3s ease';
                        event.target.style.transform = 'translate(0px, 0px)';
                        
                        setTimeout(() => {
                            if (event.target) {
                                event.target.style.transition = '';
                                event.target.style.zIndex = '';
                                event.target.style.position = '';
                                event.target.style.pointerEvents = '';
                            }
                            if (currentPlaceholder && currentPlaceholder.parentNode) {
                                currentPlaceholder.parentNode.removeChild(currentPlaceholder);
                            }
                        }, 300);
                    } else {
                        // Instantly reset for infinite drag sources
                        event.target.style.transform = 'translate(0px, 0px)';
                        event.target.style.zIndex = '';
                        event.target.style.position = '';
                        event.target.style.pointerEvents = '';
                        if (currentPlaceholder && currentPlaceholder.parentNode) {
                            currentPlaceholder.parentNode.removeChild(currentPlaceholder);
                        }
                    }
                }
            }
        });
    }
}
