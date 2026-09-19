import React from 'react';

export const SkeletonTable = ({ columns = 4, rows = 5 }) => {
    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i}>
                                <div className="skeleton-box" style={{ width: '80%', height: '16px' }}></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex}>
                                    <div 
                                        className="skeleton-box" 
                                        style={{ 
                                            width: colIndex === columns - 1 ? '50%' : (colIndex === 0 ? '70%' : '90%') 
                                        }}
                                    ></div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const SkeletonList = ({ items = 4 }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="skeleton-box" style={{ width: '20%', height: '14px' }}></div>
                    <div className="skeleton-box" style={{ width: '80%', height: '18px' }}></div>
                    <div className="skeleton-box" style={{ width: '30%', height: '12px' }}></div>
                </div>
            ))}
        </div>
    );
};
