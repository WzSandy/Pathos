import React from 'react';

const EmbroideryBorder = ({ children }) => {
  return (
    <div className="fixed inset-0 p-7 bg-[#F5F0E6]">
      <div 
        className="relative w-full h-full overflow-hidden"
        style={{
          borderImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFQAAABUCAYAAAAcaxDBAAAAAXNSR0IArs4c6QAAAtlJREFUeF7tnTFuAzEMBO1v5iNpUqbJR/LNpLYMZDBY6gQH61YURY2WPN6dYd8/v99/bsHn4+3rHkzHqWt8V6+HAS4G9wJ9JJLyKNBFYQVqcxLsx4HaGkU1jsbX/ZE9je/2R/6fUr5A3UV2PeACXbqcVFAF+mpAqeas46lCrD9bk2k/2xVKAVgA0/4KVPaNpPgC/W9A7YlO20/7oxJiFa5r6OkNnV6fDqBAoYRUocOANFCSMLU19DCBAqJnGzbFrb/p/T09HLaArD1tmA54+oAKNHxDYAVg7avQRaJrBsRA05SkFEr9X53yNt74BZs9QRvg6YuSjbdAIeULFAjszii8KFGRpppGG7AKSO1tvHb/BSrvrKimF2iBZkl/ecpP3/pRimR4eHa6vp2PbZN1OH0gjOxvi6vjL1DZZlHJKNACdUWgKe94oXWBIiJnUKCOF1ofB0oB0Pirt020Pxq//NaT2g6UnDQgAFYA5K9AX/1e/t8rlCRMGWafd54GSvux8a3711/FoZozHTD5o/HdB16gcAJVqLwXJ0XHQCmF7TsV6482mI7bawTZ03jbprZNTrOkKJtR5K8K3a1Qe2KkFzpRmp+Op+vb+X1iL7sE6gIKtEBdEbApm5a8KrQKrUIffnWHirrDxdZNeWakLI4DpQBonIq6orHBmDKE9kfjl98pbWCkXBaowsXGBcqMlMXlQFV0t9uNXjHQBmg9qlk039b0NF5s7CngAn0kVKCLYqpQSiF43rlOHwdqU9jay/0/1eh0wzZea499KJ2gXbBAocYU6OOPD1ahw4LRX8WxfeG0/bQ/6lOpZsdfxTm9odPr0wFUodBWVaHDgLYDJcnbAKgtozYr7TJsCaH965QnhwU6/JO5BVqg0UvEuG2yKW9rFNnT+O74yP/2GnoaAK1P4/aiWKDDJa9AdwMliad9o/WfpmS6np3fv/+RT/QJcIEWqPs3GVIUtUF2/i9mDI8vXLf0mwAAAABJRU5ErkJggg==') 28 / 16px / 0 round",
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