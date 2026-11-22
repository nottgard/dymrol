import './FireFlame.css';

export function FireFlame({ particleQty }: { particleQty: number }) {
    function renderParticles(qty: number) {
        const listItems = []
        for (let i = 0; i < qty; i++) {
            listItems.push(<div className="particle" key={i}></div>)
        }

        return listItems
    }

    return (
        <div className="fire">
            {renderParticles(particleQty)}
        </div>
    )
}