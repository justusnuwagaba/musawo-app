import ServiceScreenTemplate from './ServiceScreenTemplate';
const LabHome = (props) => (
    <ServiceScreenTemplate 
        title="Lab" 
        collectionName="lab" 
        iconName="flask-outline" 
        {...props} 
    />
);
export default LabHome;