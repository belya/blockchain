import React, { Component } from 'react';
import {
	View,
	Text,
	Button,
	Switch,
	TextInput,
	StyleSheet,
	ScrollView,
	FlatList
} from 'react-native';

import Row from '../Row';
import Select from '../Select';
import Cmd from '../Cmd';
import Indicator from '../Indicator';
import { withRouter } from 'react-router-native';
import Header from '../Header';
import { connect } from 'react-redux';
import web3, { contract } from '../../web3';
import sha256 from 'sha256';
import Hr from '../Hr';
import { ADDRESSES, LANGUAGES, MIN_SERVICE_FEE } from '../../constants';


const inWei = (value)=>{
		return Number((Number(value) * 1000000000000000000).toFixed(0));
}
class PlaceOrder extends Component {
	state = {
		fromLangIndex: 0,
		toLangIndex: 1,
		fromLangEdit: false,
		toLangEdit: false,
		text: `Мы - команда!`,
		address: '',
		loading: false,
		duration: '60',
		value: '1',
		lastHash: ''
	}

	onChangeTerm(textValue){

		this.setState({
				duration: Number(textValue).toFixed(0)
		});
	}

	onChangeValue(textValue){

		this.setState({
			value: textValue
		});
	}

	onChangePreformerAddress(text){
		this.setState({
			address: text
		});
	}

	onChangeText(text){
		this.setState({
			text: text
		});
	}

	onSubmit(){
		const { history, account, contractAddress, dispatch } = this.props;
		const { text, address, duration, value } = this.state;

		this.setState({
			loading: true
		}, ()=>{

				let tx_builder = contract.methods.taskCreate(
					Array.from(Buffer.from(sha256(text), 'hex')),
					address,
					duration
				);

				let transactionObject = {
				    gas: 4000000,
				    data: tx_builder.encodeABI(),
				    from: account.address,
				    to: contractAddress,
				    gasPrice: 4,
				    value: inWei(value)
				};

				web3.eth.accounts.signTransaction(transactionObject, account.privateKey)
				.then((signedTx)=>{
					return web3.eth.sendSignedTransaction(signedTx.rawTransaction).once('transactionHash', (transactionHash)=>{
						this.setState({
								loading: false,
								text: '',
								value: '0',
								address: '',
								duration: '0',
								lastHash: transactionHash
							});
						})
				})
				.catch( (e)=>{
					this.setState({
						loading: false
					});
					console.log(e);
				})


		});


	}



	get formDisabled(){
		const { contractAddress, account } = this.props;
		const { fromLangIndex, toLangIndex, text, address, fromLangEdit, toLangEdit, loading, duration, value } = this.state;

		if (fromLangIndex == toLangIndex ||
			text.length == 0 ||
			!(Number(duration) > 0) ||
			inWei(value) <= MIN_SERVICE_FEE ||
			!account ||
			address.length == 0 ||
			fromLangEdit || toLangEdit ||
			loading ||
			!contractAddress
		){
			return true;
		}
		return false;
	}

	render(){


		const { fromLangIndex, fromLangEdit, toLangIndex, toLangEdit, price, loading, text, duration, address, value, lastHash } = this.state;
		const { account } = this.props;

		return <Row style={styles.main}>

			<View style={[styles.flex, styles.cell, {height: 410}]}>
					<Header title={'Only 10 random translators'} />
					{
						ADDRESSES.filter((performer)=>!account || performer!=account.address)
						.map( (performer, index)=><Cmd key={index} title={performer} onPress={()=>this.setState({ address: performer })} />)

					}
			</View>
			<View style={[styles.flex, styles.cell]}>

					<Header title={'Choose your translator'} />

					<Row style={styles.langView}>
						{!fromLangEdit && <Cmd disabled={loading} title={LANGUAGES[fromLangIndex]} onPress={()=>this.setState({fromLangEdit: true})}/> || <Select
							data={LANGUAGES}
							selectedIndex={fromLangIndex}
							onDone={(index)=>this.setState({fromLangEdit: false, fromLangIndex: index})}
							onCancel={()=>this.setState({fromLangEdit: false})}
						/>}
						<Text> -> </Text>
						{!toLangEdit && <Cmd disabled={loading} title={LANGUAGES[toLangIndex]} onPress={()=>this.setState({toLangEdit: true})}/> || <Select
							data={LANGUAGES}
							selectedIndex={toLangIndex}
							onDone={(index)=>this.setState({toLangEdit: false, toLangIndex: index})}
							onCancel={()=>this.setState({toLangEdit: false})}
						/>}
					</Row>

					<View style={styles.inputContainer}>
		                <Text style={styles.text}>Performer address</Text>
		                <TextInput
		                            style={[styles.input, loading && styles.inputLoading || styles.inputEditable]}
		                            //multiline={true}
		                            value={address}
		                            returnKeyType={'done'}
		                            editable={!loading}
		                            autoCorrect={false}
		                            autoCapitalize={'none'}
		                            placeholder={''}
		                            keyboardType={'default'}
		                            onChangeText={this.onChangePreformerAddress.bind(this)}

		                />
	                </View>

	                <View style={styles.inputContainer}>
		                <Text style={styles.text}>Time for translation</Text>
		                <TextInput
		                            style={[styles.input, loading && styles.inputLoading || styles.inputEditable]}
		                            returnKeyType={'done'}
		                            value={duration}
		                            editable={!loading}
		                            autoCorrect={false}
		                            autoCapitalize={'none'}
		                            placeholder={'0'}
		                            keyboardType={'numeric'}
		                            onChangeText={this.onChangeTerm.bind(this)}

		                />
	                </View>

	                <View style={styles.inputContainer}>
		                <View><Text style={styles.text}>Value</Text></View>
		                <TextInput
		                            style={[styles.input, loading && styles.inputLoading || styles.inputEditable]}
		                            returnKeyType={'done'}
		                            value={value}
		                            editable={!loading}
		                            autoCorrect={false}
		                            autoCapitalize={'none'}
		                            placeholder={'0'}
		                            keyboardType={'numeric'}
		                            onChangeText={this.onChangeValue.bind(this)}

		                />
	                </View>

	                <View style={styles.inputContainer}>
		                <Text style={styles.text}>Text to translate</Text>
		                <TextInput
		                            style={[styles.input, loading && styles.inputLoading || styles.inputEditable, {height: 50}]}
		                            multiline={true}
		                            value={text}
		                            returnKeyType={'done'}
		                            editable={!loading}
		                            autoCorrect={false}
		                            autoCapitalize={'none'}
		                            placeholder={''}
		                            keyboardType={'default'}
		                            onChangeText={this.onChangeText.bind(this)}

		                />
	                </View>

	                <View style={styles.inputContainer}>
	                	{loading && <Indicator title={'loading...'} /> || <Button disabled={this.formDisabled} title="SEND TRANSACTION" onPress={this.onSubmit.bind(this)}/>}
	                </View>

	                <Text style={styles.hashText}>
	                	{lastHash}
	                </Text>
	            </View>
            </Row>
	}
}


const styles = StyleSheet.create({
	main: {
		justifyContent: 'space-evenly',
		alignItems: 'flex-start',
		flex: 1
	},
	cell: {
		marginLeft: 20,
		marginRight: 20
	},
	flex: {flex:1},
	langView: {
		justifyContent: 'flex-start'
	},
	form: {
		alignSelf: 'center',
		borderColor: 'rgba(0, 0, 0, 0.1)',
	},
    input: {
    	margin: 4,
    	borderWidth: 1,
    	borderColor: 'rgba(0, 0, 0, 0.1)',
    	height: 31,
        width: 400,
        paddingLeft: 4,
        fontSize: 16,
        flex: 1,
        textAlign: 'left',
        justifyContent: 'center',
    },
    inputEditable: {
        backgroundColor: 'white'
    },
   	inputLoading: {
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    hashText: {
    	margin: 4,
    	padding: 4
    },
    text: {
    	marginLeft: 4,
    	marginRight: 4
    },
    inputContainer: {
    	marginTop: 8
    }
});
const mapStateToProps = ({data, dispatch}) => {
	return {
        account: data.account,
        contractAddress: data.contractAddress,
	}
}
export default withRouter( connect(mapStateToProps)(PlaceOrder) );
