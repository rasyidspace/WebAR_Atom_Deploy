export class AtomService {
    static async getAtom(id) {
        try {
            const response = await fetch('data/atoms.json');
            const data = await response.json();
            const atom = data.find(item => item.id === id);
            
            if (atom) {
                // Map the marker path based on the atom ID
                const markerMap = {
                    'dalton': 'assets/markers/dalton_targets.mind',
                    'thomson': 'assets/markers/thomson_targets.mind',
                    'penemuan-elektron': 'assets/markers/thomson_targets.mind',
                    'penemuan-inti': 'assets/markers/rutherford_targets.mind',
                    'rutherford': 'assets/markers/rutherford_targets.mind',
                    'bohr': 'assets/markers/nielsbohr_targets.mind',
                    'quantum': 'assets/markers/mekakuantum_targets.mind'
                };
                
                atom.marker = markerMap[atom.id] || `assets/markers/${atom.id}_targets.mind`;
                return atom;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch atom data:", error);
            return null;
        }
    }
}
