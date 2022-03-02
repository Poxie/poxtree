import React, { useEffect, useRef, useState } from 'react';
import styles from '../styles/Input.module.scss';

type Props = {
    label?: string;
    placeholder?: string;
    value?: string;
    onChange?: (text: string) => void;
    onSubmit?: (text: string) => void;
    clearOnSubmit?: boolean;
    className?: string;
}
export const Input: React.FC<Props> = ({ label, placeholder, value: _value, onChange, onSubmit, clearOnSubmit, className }) => {
    const [value, setValue] = useState(_value || '');
    const ref = useRef<HTMLInputElement>(null);

    // If value property change, update value
    useEffect(() => {
        setValue(_value || '');
    }, [_value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setValue(val);

        if(onChange) {
            onChange(val);
        }
    }
    const handleSubmit = (e: React.FormEvent) => {
        if(!ref.current) return;

        e.preventDefault();
        if(onSubmit) {
            onSubmit(value);
        }
        
        if(clearOnSubmit) {
            setValue('');
        }
    }

    className = [styles.form, className].join(' ');
    return(
        <form onSubmit={handleSubmit} className={className}>
            {label && (
                <label htmlFor={label} className={styles.label}>
                    {label}
                </label>
            )}
            <input 
                id={label}
                type="text"
                placeholder={placeholder}
                onChange={handleChange}
                value={value}
                ref={ref}
            />
        </form>
    )
}