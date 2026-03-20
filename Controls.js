export class Controls {
    constructor() {
        this.keys = { forward: false, backward: false, left: false, right: false, brake: false };
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));

        this.initTouchControls();
    }

    initTouchControls() {
        const buttons = [
            { id: 'btn-forward', key: 'forward' },
            { id: 'btn-backward', key: 'backward' },
            { id: 'btn-left', key: 'left' },
            { id: 'btn-right', key: 'right' }
        ];

        buttons.forEach(btn => {
            const el = document.getElementById(btn.id);
            if (el) {
                const handleStart = (e) => {
                    e.preventDefault();
                    this.keys[btn.key] = true;
                };
                const handleEnd = (e) => {
                    e.preventDefault();
                    this.keys[btn.key] = false;
                };

                el.addEventListener('touchstart', handleStart, { passive: false });
                el.addEventListener('touchend', handleEnd, { passive: false });
                el.addEventListener('mousedown', handleStart);
                el.addEventListener('mouseup', handleEnd);
                el.addEventListener('mouseleave', handleEnd);
            }
        });
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.keys.forward = true; break;
            case 'ArrowLeft': case 'KeyA': this.keys.left = true; break;
            case 'ArrowDown': case 'KeyS': this.keys.backward = true; break;
            case 'ArrowRight': case 'KeyD': this.keys.right = true; break;
            case 'Space': this.keys.brake = true; break;
        }
    }
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.keys.forward = false; break;
            case 'ArrowLeft': case 'KeyA': this.keys.left = false; break;
            case 'ArrowDown': case 'KeyS': this.keys.backward = false; break;
            case 'ArrowRight': case 'KeyD': this.keys.right = false; break;
            case 'Space': this.keys.brake = false; break;
        }
    }
}
