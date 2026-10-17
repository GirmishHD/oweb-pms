import React from 'react';
import { ICONS } from '../constants';
export const Section = ({ title, subtitle, children, className = '' }) => {
    return (<div className={`bg-white rounded-2xl border border-sky-100 shadow-xs mb-8 overflow-hidden transition-all duration-200 hover:border-sky-200 ${className}`}>
            <div className="px-6 py-4.5 border-b border-sky-100/80 bg-slate-50/60 flex flex-col justify-center">
                <h3 className="font-extrabold text-slate-900 text-base tracking-tight">{title}</h3>
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>);
};
export const Input = ({ label, id, helperText, ...props }) => (<div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 tracking-wide uppercase">{label}</label>
        <input id={id} {...props} className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition duration-150 disabled:bg-slate-100 disabled:text-slate-400 placeholder:text-slate-400"/>
        {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>);
export const Select = ({ label, id, options, children, helperText, ...props }) => (<div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 tracking-wide uppercase">{label}</label>
        <div className="relative">
            <select id={id} {...props} className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition duration-150 disabled:bg-slate-100 disabled:text-slate-400 appearance-none pr-10">
                {options ? options.map(opt => <option key={opt} value={opt}>{opt}</option>) : children}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/>
                </svg>
            </div>
        </div>
        {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>);
export const Checkbox = ({ label, description, id, ...props }) => (<div className="flex items-start gap-2.5">
        <input id={id} type="checkbox" {...props} className="mt-0.5 h-4 w-4 rounded-md text-cyan-600 bg-slate-50 border-slate-300 focus:ring-2 focus:ring-cyan-500/30 transition cursor-pointer"/>
        {(label || description) && (<label htmlFor={id} className="text-xs text-slate-800 cursor-pointer select-none">
                {label && <span className="font-semibold block">{label}</span>}
                {description && <span className="text-[11px] text-slate-500 block mt-0.5">{description}</span>}
            </label>)}
    </div>);
export const TextArea = ({ label, id, helperText, ...props }) => (<div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 tracking-wide uppercase">{label}</label>
        <textarea id={id} {...props} className="w-full px-3.5 py-2.5 bg-slate-50/70 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition duration-150 placeholder:text-slate-400"/>
        {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>);
export const FileInput = ({ label, id, name, onChange, fileName, helperText, ...props }) => (<div className="space-y-1.5">
        <label htmlFor={id} className="block text-xs font-bold text-slate-700 tracking-wide uppercase">{label}</label>
        <div className="flex items-center gap-3">
            <label htmlFor={id} className="cursor-pointer px-4 py-2 bg-white border border-sky-200 hover:border-cyan-400 rounded-xl text-xs text-cyan-900 hover:text-cyan-950 hover:bg-sky-50 shadow-2xs font-bold transition-all flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <span>Upload Document</span>
                <input id={id} name={name} type="file" onChange={onChange} className="hidden" {...props}/>
            </label>
            {fileName && (<div className="flex items-center text-xs text-slate-600 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200/80">
                    {React.cloneElement(ICONS.paperclip, { className: 'w-3.5 h-3.5 mr-1.5 text-cyan-600 flex-shrink-0' })}
                    <span className="font-medium truncate max-w-[220px]" title={fileName}>{fileName}</span>
                </div>)}
        </div>
        {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
    </div>);
