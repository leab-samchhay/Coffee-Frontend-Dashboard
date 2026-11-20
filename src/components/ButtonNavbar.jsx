import React from 'react';

const ButtonNavbar = ({ icon, label, isActive = false, isChild = false, onClick }) => {
    return (
        <button
            onClick={onClick}
            type="button"
            className={`w-full flex items-center gap-3 transition-all duration-200 cursor-pointer text-left select-none ${
                isChild 
                    ? 'px-3 py-2 text-xs font-medium rounded-lg' 
                    : 'px-3.5 py-2.5 text-sm font-medium rounded-xl'
            } ${
                isActive 
                    ? 'bg-white text-emerald-950 font-semibold shadow-md shadow-black/10' 
                    : 'text-emerald-100/75 hover:text-white hover:bg-white/10 active:scale-[0.98]'
            }`}
        >
            {icon ? (
                <span className={`shrink-0 transition-colors ${
                    isActive ? 'text-emerald-700' : 'text-emerald-300/80'
                }`}>
                    {icon}
                </span>
            ) : isChild ? (
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                    isActive ? 'bg-emerald-600 ring-2 ring-emerald-300' : 'bg-emerald-400/40'
                }`} />
            ) : null}
            
            <span className="truncate tracking-wide">{label}</span>

            {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            )}
        </button>
    );
};

export default ButtonNavbar;
