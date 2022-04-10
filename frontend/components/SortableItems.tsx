import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

type SortableContextType = {
    changeIndex: (currentIndex: number, newIndex: number) => void;
}
const SortableContext = React.createContext({} as SortableContextType);
const useSortable = () => React.useContext(SortableContext);

export type SortableItemsProps = {
    items: any[];
    component: FunctionComponent<any>;
    onDragEnd: (items: any[]) => void;
    spacing?: string | number;
}
export const SortableItems: React.FC<SortableItemsProps> = ({ items, component, onDragEnd, spacing='var(--spacing-primary)' }) => {
    const refs = useRef<React.RefObject<HTMLDivElement>[]>([]);
    const tempItems = useRef(items.map(item => ({...item})));
    const [currentItems, setCurrentItems] = useState(items.map(item => ({...item})));

    const changeIndex: SortableContextType['changeIndex'] = (currentIndex, newIndex) => {
        updateElementOrder(currentIndex, newIndex);
    }
    const updateElementOrder = useCallback((prevIndex: number, draggedIndex: number) => {
        refs.current.forEach(ref => {
            if(!ref.current || ref.current.getAttribute('data-dragging') === "true") return;

            // Getting dimensions
            const { height } = ref.current.getBoundingClientRect();

            // Getting self-order
            const currentIndex = parseInt(ref.current.getAttribute('data-order') || '');
            if(currentIndex === null) return;

            // Getting item relation to dragged item
            const draggedItemIsAbove = prevIndex < currentIndex;
            const draggedItemEnteredMe = draggedIndex === currentIndex;

            // Making sure only affected items go through process
            if(draggedItemIsAbove && !draggedItemEnteredMe) return;
            if(!draggedItemIsAbove && !draggedItemEnteredMe) return;
            
            // Defining translation threshholds
            const isAnimated = !ref.current.style.transform.includes('0px');
            const translateUp = isAnimated ? 'translateY(0)' : `translateY(calc(${-height}px - ${spacing}))`;
            const translateDown = isAnimated ? 'translateY(0)' : `translateY(calc(${height}px + ${spacing}))`;

            // Determining translation values based on relations
            if(draggedItemIsAbove && draggedItemEnteredMe) {
                ref.current.style.transform = translateUp;
            } else if(!draggedItemIsAbove && draggedItemEnteredMe) {
                ref.current.style.transform = translateDown;
            }

            // Updating my order attribute
            let newIndex = 0;
            if(draggedItemEnteredMe && draggedItemIsAbove) {
                newIndex = currentIndex - 1
            } else if(draggedItemEnteredMe && !draggedItemIsAbove) {
                newIndex = currentIndex + 1
            }
            ref.current.setAttribute('data-order', newIndex.toString());
            
            // Updating temp items ref
            const draggedItem = tempItems.current.find(item => item.order === prevIndex);
            const currentItem = tempItems.current.find(item => item.order === currentIndex);
            draggedItem.order = currentIndex;
            currentItem.order = newIndex;

            // Updating dragged item order attribute
            if(draggedItemEnteredMe) {
                document.querySelector('[data-dragging=true]')?.setAttribute('data-order', currentIndex.toString());
            }
        })
    }, [refs]);
    const handleDragEnd = useCallback(() => {
        if(JSON.stringify(tempItems.current) === JSON.stringify(items)) return;
        onDragEnd(tempItems.current);
        setCurrentItems([...tempItems.current].sort((a,b) => a.order - b.order));
        console.log(tempItems.current);
    }, [items, onDragEnd, tempItems.current]);

    useEffect(() => {
        // Updating tempItems on items array change
        if(JSON.stringify(tempItems.current) !== JSON.stringify(items)) {
            tempItems.current = items.map(item => ({...item})).sort((a,b) => a.order - b.order);
            setCurrentItems(items.map(item => ({...item})).sort((a,b) => a.order - b.order));
        }

        document.addEventListener('dragend', handleDragEnd);

        return () => document.removeEventListener('dragend', handleDragEnd);
    }, [items]);

    // Fetching reference for sortable item
    const getReference = useCallback((index: number) => {
        // Checks if reference exist
        if(refs.current[index]) return refs.current[index];

        // Else create new
        const ref = React.createRef<HTMLDivElement>();
        refs.current.push(ref);
        return ref;
    }, []);

    const value = {
        changeIndex
    }

    return(
        <SortableContext.Provider value={value}>
            {currentItems.map((item, index) => <SortableItem item={item} component={component} index={index} ref={getReference(index)} key={item.id} />)}
        </SortableContext.Provider>
    )
}

type SortableItemProps = {
    index: number;
    item: any;
    component: FunctionComponent<any>;
    ref: React.RefObject<HTMLDivElement>;
}
const SortableItem: React.FC<SortableItemProps> = React.memo(React.forwardRef<HTMLDivElement, SortableItemProps>(({ component: Component, index, item }, forwardRef) => {
    const { changeIndex } = useSortable();
    const ref = useRef<HTMLDivElement>(null);
    const [beingDragged, setBeingDragged] = useState(false);
    const dragging = useRef(false);
    const initialPosition = useRef({ initialLeft: 0, initialTop: 0 });
    const initialMousePos = useRef({ mouseLeft: 0, mouseTop: 0 });
    const dimensions = useRef({ width: 0, height: 0 });

    // Allowing both ref and forwardRef
    React.useImperativeHandle(forwardRef, () => ref.current as HTMLDivElement);

    const handleDragEnd = useCallback((e: DragEvent) => {
        if(!ref.current)return;

        // Updating dragging state
        dragging.current = false;
        setBeingDragged(false);
        
        // Restoring initial values
        initialPosition.current = { initialLeft: 0, initialTop: 0 };
        initialMousePos.current = { mouseLeft: 0, mouseTop: 0 };
        ref.current.style.pointerEvents = '';
        ref.current.style.transform = '';
    }, []);
    const handleDragStart = useCallback((e: DragEvent) => {
        if(!ref.current) return;

        // Updating dragging state
        dragging.current = true;
        setBeingDragged(true);

        // Getting drag event positional values
        const { x, y } = e;
        const { left, top } = ref.current.getBoundingClientRect();

        // Determining mouse position relative to dragged div
        const mouseLeft = x - left;
        const mouseTop = y - top;

        initialMousePos.current = { mouseLeft, mouseTop };
        initialPosition.current = { initialLeft: x, initialTop: y };
    }, []);
    const handleDrag = useCallback((e: DragEvent) => {
        if(!ref.current) return;

        // Getting initial positional values
        const { mouseLeft, mouseTop } = initialMousePos.current;
        const { height } = dimensions.current;
        const { initialTop, initialLeft } = initialPosition.current;

        // Getting drag event positional values
        const { x, y } = e;
        const { left, top } = ref.current.getBoundingClientRect();

        // Determining translate values
        const newTop = y - mouseTop - initialTop + mouseTop;
        const newLeft = x - mouseLeft - initialLeft + mouseLeft;

        // Setting translate values
        ref.current.style.transform = `translateY(${newTop}px) translateX(${newLeft}px)`;
        ref.current.style.pointerEvents = 'none';
    }, []);
    const handleDragEnter = useCallback(() => {
        if(dragging.current) return;

        // Fetching dragged element
        const draggedElement = document.querySelector('[data-dragging=true]');
        const draggedElementIndex = parseInt(draggedElement?.getAttribute('data-order') || '');
        if(!draggedElement) return;
        
        // Getting current item index
        const currentIndex = parseInt(ref.current?.getAttribute('data-order') || '');
        if(currentIndex === null) return;

        // Updating dragged element index
        changeIndex(draggedElementIndex, currentIndex);
    }, []);

    // Initial setup
    useEffect(() => {
        if(!ref.current) return;

        // Setting up drag event handlers
        ref.current.addEventListener('dragstart', handleDragStart);
        ref.current.addEventListener('drag', handleDrag);
        ref.current.addEventListener('dragenter', handleDragEnter);
        document.addEventListener('dragend', handleDragEnd);
        
        // Getting item dimensions
        const { width, height } = ref.current.getBoundingClientRect();
        dimensions.current = { width, height };
    }, []);

    return(
        <div 
            ref={ref} 
            draggable 
            data-dragging={beingDragged}
            data-order={item.order}
        >
            <Component {...item} />
        </div>
    )
}));