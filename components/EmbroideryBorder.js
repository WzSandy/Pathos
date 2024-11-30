import React from 'react';

const EmbroideryBorder = ({ children }) => {
  return (
    <div className="fixed inset-0 p-7 bg-[#F5F0E6]">
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{
            borderImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IArs4c6QAAAm9JREFUeF7tnUFWxCAQRM01vYgbl268iNfUrWF8+a9fFaRxym2TpvgU0JOZxOPj6+375eLv/fXz+B0e24/xq1z/IUa8DmoQoGcbEK8ALS6bAC0Co+ZloM+2JxJAio+AH5Z8gBLC6z01QGv8HlrHoSLA8fIHoJSf6k7apCn/bnHaEk9F+1+DC9AzlQA1L4EA3Q2oWe926eyH0nYEzIIDNEDNBMzppjuUyiwqjKu3C939VfWN7eU6VBVAQNT4bH0BOnxDQXUlTWiAdgdKM0hx8xmBd4Nm79HyHkrAKB6gxW9BA3SwDAFR43Ho4FC1LJkNVNVHhml3ygdoHHp5kMunvLqk4lBw6GpAs/u7fQ+dPcDV+QPUTDxAdwdanUHzeOV0pJ/i9jq02qFMwJyA9FM8QM0frQO0O1DzCmyXbvmSb0fALChAA9RMwJxuuUOrHZrHK6cj/RTPKd/9lK/OoGwpcwLST/E4tLtDzYZpl265Q9sRMAsK0AA1EzCnW+7Qaofm8crpSD/Fc8p3P+WrMyhbypyA9FM8Du3uULNh2qVb7tB2BMyCAjRAzQTM6W53aFWAefyYrqqv2j6/vjP/PDNAAxRX9WWD6hKutpcdSh1SXMPDV1P/anz5JyUSzEi0FtS/Gg/Qyc9ZZcnDs5/kYLtDx4RVAdRejc/WF6Ddn0ae7YA41OyA7YCSYK1o2f/qKp+87hLmPEDNiyJA7wZK/Y8zRO13j1ffSSLXobsDI/0BSoSK8QAtAqPmMtDqKUaCni0+8ksdKjogQEWAdO8iDhUBo0PH/PT2QlFPu8vpTKG6vPzvf9oRMAsK0AA1EzCnUx36A0YGZRG9X2tAAAAAAElFTkSuQmCC') 28 / 28px / 0 round",
            borderWidth: "28px",
            borderStyle: "solid"
        }}
      >
        <main className="font-monument w-full h-full overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default EmbroideryBorder;